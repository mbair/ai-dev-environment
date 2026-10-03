import importlib.util
from pathlib import Path
import tempfile
import tomllib
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('reserve_registration', ROOT / 'scripts/register-reserve-mcp.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ReserveRegistrationTests(unittest.TestCase):
    def test_existing_settings_and_backup_are_preserved_and_repeat_is_idempotent(self):
        with tempfile.TemporaryDirectory() as d:
            home = Path(d)
            original = b'# user comment\nmodel="custom"\n[mcp_servers.existing]\ncommand="user-tool"\nenabled=false\n'
            config = home / 'config.toml'
            config.write_bytes(original)
            module.register(home, {'command': '/node', 'args': ['/server'], 'env': {'RESERVE_DIAGNOSTICS_CONFIG': '/private/config.json'}})
            installed = config.read_bytes()
            self.assertTrue(installed.startswith(original))
            self.assertEqual(next((home / 'environment-backups').glob('*/config.toml')).read_bytes(), original)
            self.assertFalse(tomllib.loads(installed.decode())['mcp_servers']['existing']['enabled'])
            module.register(home, {'command': '/different'})
            self.assertEqual(config.read_bytes(), installed)

    def test_disabled_server_is_preserved(self):
        with tempfile.TemporaryDirectory() as d:
            home = Path(d)
            original = b'[mcp_servers.reserve-diagnostics]\ncommand="own"\nenabled=false\n'
            (home / 'config.toml').write_bytes(original)
            module.register(home, {'command': '/node'})
            self.assertEqual((home / 'config.toml').read_bytes(), original)

    def test_desktop_wrapper_selects_distribution_and_keeps_env_inside_wsl(self):
        spec = module.definition('/node', Path('/private/config.json'), 'Ubuntu')
        self.assertEqual(spec['command'], r'C:\Windows\System32\wsl.exe')
        self.assertEqual(spec['args'][:2], ['--distribution', 'Ubuntu'])
        self.assertIn('RESERVE_DIAGNOSTICS_CONFIG=/private/config.json', spec['args'])
        self.assertNotIn('env', spec)
