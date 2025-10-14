/**
 * ADDRESS QEMU Handler - CoW Cloning Tests
 * Tests base image registry and Copy-on-Write VM cloning
 *
 * These tests verify the enterprise deployment pattern using QCOW2 backing files
 * for rapid horizontal scaling across regions.
 */

const { createQemuTestHandler } = require('./test-helper');

describe('ADDRESS QEMU Handler - CoW Cloning', () => {

  test('should register base image', async () => {
    const handler = await createQemuTestHandler();

    const result = await handler.handleAddressCommand(
      'register_base name=ubuntu-base disk=/vm-images/bases/ubuntu.qcow2 memory=2G cpus=2 rexxjs_installed=true'
    );

    expect(result.success).toBe(true);
    expect(result.operation).toBe('register_base');
    expect(result.name).toBe('ubuntu-base');
    expect(result.disk).toBe('/vm-images/bases/ubuntu.qcow2');
    expect(result.output).toContain('registered successfully');

    // Verify it's in the registry
    const baseImage = handler.baseImageRegistry.get('ubuntu-base');
    expect(baseImage).toBeDefined();
    expect(baseImage.name).toBe('ubuntu-base');
    expect(baseImage.diskPath).toBe('/vm-images/bases/ubuntu.qcow2');
    expect(baseImage.memory).toBe('2G');
    expect(baseImage.cpus).toBe(2);
    expect(baseImage.status).toBe('ready');
    expect(baseImage.metadata.rexxjsInstalled).toBe(true);
  });

  test('should list registered base images', async () => {
    const handler = await createQemuTestHandler();

    // Register two bases
    await handler.handleAddressCommand('register_base name=base-debian disk=/bases/debian.qcow2 memory=2G cpus=2');
    await handler.handleAddressCommand('register_base name=base-ubuntu disk=/bases/ubuntu.qcow2 memory=4G cpus=4');

    const result = await handler.handleAddressCommand('list_bases');

    expect(result.success).toBe(true);
    expect(result.operation).toBe('list_bases');
    expect(result.count).toBe(2);
    expect(result.bases).toHaveLength(2);

    // Check first base
    const debian = result.bases.find(b => b.name === 'base-debian');
    expect(debian).toBeDefined();
    expect(debian.diskPath).toBe('/bases/debian.qcow2');
    expect(debian.memory).toBe('2G');
    expect(debian.cpus).toBe(2);

    // Check second base
    const ubuntu = result.bases.find(b => b.name === 'base-ubuntu');
    expect(ubuntu).toBeDefined();
    expect(ubuntu.diskPath).toBe('/bases/ubuntu.qcow2');
    expect(ubuntu.memory).toBe('4G');
    expect(ubuntu.cpus).toBe(4);
  });

  test('should list bases when registry is empty', async () => {
    const handler = await createQemuTestHandler();

    const result = await handler.handleAddressCommand('list_bases');

    expect(result.success).toBe(true);
    expect(result.operation).toBe('list_bases');
    expect(result.count).toBe(0);
    expect(result.bases).toHaveLength(0);
  });

  test('should clone VM from base image using CoW', async () => {
    const handler = await createQemuTestHandler();

    // Register base first
    await handler.handleAddressCommand('register_base name=rhel-base disk=/bases/rhel8.qcow2 memory=4G cpus=2');

    // Clone with no_start to avoid starting VM in test
    const result = await handler.handleAddressCommand('clone base=rhel-base name=app-instance-1 no_start=true');

    expect(result.success).toBe(true);
    expect(result.operation).toBe('clone');
    expect(result.basedOn).toBe('rhel-base');
    expect(result.name).toBe('app-instance-1');
    expect(result.disk).toContain('app-instance-1.qcow2');
    expect(result.started).toBe(false);
    expect(result.output).toContain('cloned from rhel-base successfully');
  });

  test('should clone VM and start it automatically when no_start not specified', async () => {
    const handler = await createQemuTestHandler();

    await handler.handleAddressCommand('register_base name=debian-base disk=/bases/debian11.qcow2 memory=2G cpus=2');

    // Without no_start parameter, VM should start
    const result = await handler.handleAddressCommand('clone base=debian-base name=web-server-1 memory=4G cpus=4');

    expect(result.success).toBe(true);
    expect(result.operation).toBe('clone');
    expect(result.basedOn).toBe('debian-base');
    expect(result.name).toBe('web-server-1');
    expect(result.started).toBe(true);
    expect(result.output).toContain('started successfully');

    // Verify VM is in activeVMs with correct config
    expect(handler.activeVMs.has('web-server-1')).toBe(true);
    const vm = handler.activeVMs.get('web-server-1');
    expect(vm.status).toBe('running');
    expect(vm.memory).toBe('4G');
    expect(vm.cpus).toBe('4');
  });

  test('should use base image defaults when clone does not specify memory/cpus', async () => {
    const handler = await createQemuTestHandler();

    await handler.handleAddressCommand('register_base name=base disk=/bases/alpine.qcow2 memory=512M cpus=1');

    const result = await handler.handleAddressCommand('clone base=base name=lightweight-clone');

    expect(result.success).toBe(true);

    // Should inherit base image's memory and cpus
    const vm = handler.activeVMs.get('lightweight-clone');
    expect(vm.memory).toBe('512M');
    expect(vm.cpus).toBe(1); // cpus is stored as number
  });

  test('should create multiple clones from same base (enterprise pattern)', async () => {
    const handler = await createQemuTestHandler();

    await handler.handleAddressCommand('register_base name=app-base disk=/bases/rhel8-jdk17.qcow2 memory=4G cpus=2');

    // Clone 3 instances for multi-region deployment
    const clone1 = await handler.handleAddressCommand('clone base=app-base name=myapp-us-east-1 no_start=true');
    const clone2 = await handler.handleAddressCommand('clone base=app-base name=myapp-eu-west-1 no_start=true');
    const clone3 = await handler.handleAddressCommand('clone base=app-base name=myapp-ap-south-1 no_start=true');

    expect(clone1.success).toBe(true);
    expect(clone2.success).toBe(true);
    expect(clone3.success).toBe(true);

    // All should reference same base
    expect(clone1.basedOn).toBe('app-base');
    expect(clone2.basedOn).toBe('app-base');
    expect(clone3.basedOn).toBe('app-base');

    // Each should have unique disk
    expect(clone1.disk).toContain('myapp-us-east-1.qcow2');
    expect(clone2.disk).toContain('myapp-eu-west-1.qcow2');
    expect(clone3.disk).toContain('myapp-ap-south-1.qcow2');
  });

  test('should generate auto-name when clone does not specify name', async () => {
    const handler = await createQemuTestHandler();

    await handler.handleAddressCommand('register_base name=base disk=/bases/ubuntu.qcow2');

    const result = await handler.handleAddressCommand('clone base=base no_start=true');

    expect(result.success).toBe(true);
    expect(result.name).toMatch(/^clone-\d+-[a-z0-9]+$/);
    expect(result.disk).toContain(result.name + '.qcow2');
  });

  test('should handle missing base image error', async () => {
    const handler = await createQemuTestHandler();

    const result = await handler.handleAddressCommand('clone base=non-existent-base name=fail-clone');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Base image non-existent-base not found');
  });

  test('should handle clone without base parameter', async () => {
    const handler = await createQemuTestHandler();

    const result = await handler.handleAddressCommand('clone name=no-base-clone');

    expect(result.success).toBe(false);
    expect(result.error).toContain('clone requires base parameter');
  });

  test('should handle register_base without required parameters', async () => {
    const handler = await createQemuTestHandler();

    // Missing disk parameter
    let result = await handler.handleAddressCommand('register_base name=test-base memory=2G');

    expect(result.success).toBe(false);
    expect(result.error).toContain('requires name and disk parameters');

    // Missing name parameter
    result = await handler.handleAddressCommand('register_base disk=/bases/test.qcow2');

    expect(result.success).toBe(false);
    expect(result.error).toContain('requires name and disk parameters');
  });

  test('should parse rexxjs-vm-base metadata from script comments', async () => {
    const handler = await createQemuTestHandler();

    // Mock a script file with metadata comments
    const mockScript = `#!/usr/bin/env rexx
/* rexxjs-vm-base: ubuntu-jdk17-base */
/* rexxjs-vm-memory: 4G */
/* rexxjs-vm-cpus: 2 */
/* rexxjs-vm-ingress-port: 8080 */
/* rexxjs-vm-egress-ports: 3306, 6379, 5432 */
/* rexxjs-vm-timeout: 180 */

SAY "Hello World"`;

    // Override readFileSync for this test
    handler.fs.readFileSync = jest.fn(() => mockScript);

    const metadata = handler.parseScriptMetadata('/fake/script.rexx');

    expect(metadata.vmBase).toBe('ubuntu-jdk17-base');
    expect(metadata.memory).toBe('4G');
    expect(metadata.cpus).toBe(2);
    expect(metadata.ingressPort).toBe(8080);
    expect(metadata.egressPorts).toEqual([3306, 6379, 5432]);
    expect(metadata.timeout).toBe(180);
  });

  test('should parse script metadata with missing optional fields', async () => {
    const handler = await createQemuTestHandler();

    // Mock a script with only base specified
    const mockScript = `#!/usr/bin/env rexx
/* rexxjs-vm-base: minimal-base */

SAY "Minimal metadata"`;

    handler.fs.readFileSync = jest.fn(() => mockScript);

    const metadata = handler.parseScriptMetadata('/fake/minimal.rexx');

    expect(metadata.vmBase).toBe('minimal-base');
    // Should use defaults for missing fields
    expect(metadata.memory).toBe('2G');
    expect(metadata.cpus).toBe(2);
    expect(metadata.ingressPort).toBeNull();
    expect(metadata.egressPorts).toEqual([]);
    expect(metadata.timeout).toBe(120);
  });

  test('should parse script metadata with no metadata comments', async () => {
    const handler = await createQemuTestHandler();

    // Mock a script without any metadata
    const mockScript = `#!/usr/bin/env rexx
SAY "No metadata here"`;

    handler.fs.readFileSync = jest.fn(() => mockScript);

    const metadata = handler.parseScriptMetadata('/fake/no-metadata.rexx');

    // Should return all defaults/nulls
    expect(metadata.vmBase).toBeNull();
    expect(metadata.memory).toBe('2G');
    expect(metadata.cpus).toBe(2);
    expect(metadata.ingressPort).toBeNull();
  });

  test('should track base image created timestamp', async () => {
    const handler = await createQemuTestHandler();

    const beforeTime = Date.now();

    await handler.handleAddressCommand('register_base name=timestamped disk=/bases/test.qcow2');

    const afterTime = Date.now();

    const baseImage = handler.baseImageRegistry.get('timestamped');
    expect(baseImage.created).toBeDefined();
    // created is an ISO string, so just verify it's recent
    const createdTime = new Date(baseImage.created).getTime();
    expect(createdTime).toBeGreaterThanOrEqual(beforeTime);
    expect(createdTime).toBeLessThanOrEqual(afterTime);
  });

  test('should store arbitrary metadata in base image', async () => {
    const handler = await createQemuTestHandler();

    const result = await handler.handleAddressCommand(
      'register_base name=custom-base disk=/bases/custom.qcow2 memory=8G cpus=4 rexxjs_installed=true custom_field=custom_value'
    );

    expect(result.success).toBe(true);

    const baseImage = handler.baseImageRegistry.get('custom-base');
    expect(baseImage.metadata.rexxjsInstalled).toBe(true);
    expect(baseImage.metadata.custom_field).toBe('custom_value');
  });

});
