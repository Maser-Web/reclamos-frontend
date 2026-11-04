const [major, minor, patch] = process.versions.node.split('.').map(Number);
if (major !== 24 || minor < 22 || (minor === 22 && patch < 1)) {
  console.error('Se requiere Node.js >=24.22.1 <25 (correccion de Node2Shell). Version actual: ' + process.version);
  process.exit(1);
}
