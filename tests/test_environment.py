import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]

def load():
    spec = importlib.util.spec_from_file_location('environment', ROOT / 'scripts/environment.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

class IntegrityTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'plugins/core/skills/example').mkdir(parents=True)
        (self.root / 'plugins/core/skills/example/SKILL.md').write_text('original')

    def test_tampered_skill_is_rejected_before_install(self):
        module = load()
        module.write_lock(self.root)
        (self.root / 'plugins/core/skills/example/SKILL.md').write_text('tampered')
        with self.assertRaisesRegex(ValueError, 'Integrity'):
            module.verify(self.root)

    def test_untracked_executable_resource_is_rejected(self):
        module = load()
        module.write_lock(self.root)
        (self.root / 'plugins/core/skills/example/injected.py').write_text('print(1)')
        with self.assertRaisesRegex(ValueError, 'Integrity'):
            module.verify(self.root)

    def test_deleted_resource_is_rejected(self):
        module = load()
        module.write_lock(self.root)
        (self.root / 'plugins/core/skills/example/SKILL.md').unlink()
        with self.assertRaisesRegex(ValueError, 'Integrity'):
            module.verify(self.root)

class CopyTests(unittest.TestCase):
    def test_existing_user_config_is_not_touched(self):
        module = load()
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            source = root / 'source'
            source.mkdir()
            (source / 'SKILL.md').write_text('new')
            dest = root / 'home/skills/example'
            dest.mkdir(parents=True)
            (dest / 'SKILL.md').write_text('existing')
            config = root / 'home/config.toml'
            config.write_text('model="custom"')
            module.install_skill(source, dest, root / 'backup')
            self.assertEqual((dest / 'SKILL.md').read_text(), 'new')
            self.assertEqual(config.read_text(), 'model="custom"')
            self.assertEqual((root / 'backup/example/SKILL.md').read_text(), 'existing')

    def test_install_is_idempotent(self):
        module = load()
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            source = root / 'source'
            source.mkdir()
            (source / 'SKILL.md').write_text('same')
            dest = root / 'target/example'
            module.install_skill(source, dest, root / 'backup')
            module.install_skill(source, dest, root / 'backup')
            self.assertTrue(dest.exists())
            self.assertEqual((dest / 'SKILL.md').read_text(), 'same')
            self.assertFalse((root / 'backup').exists())

if __name__ == '__main__':
    unittest.main()

class McpTests(unittest.TestCase):
    def test_configured_and_disabled_servers_are_preserved(self):
        module = load()
        servers = {'graft': {'command': 'npx'}, 'reticle': {'command': 'npx'}, 'docs': {'url': 'https://example.com'}}
        installed = [{'name': 'graft', 'enabled': True}, {'name': 'reticle', 'enabled': False}]
        self.assertEqual(module.missing_mcp(servers, installed), ['docs'])
