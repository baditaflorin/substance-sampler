export async function computeHeightWithWebGPU(
  source: ImageData
): Promise<Uint8ClampedArray | null> {
  if (!navigator.gpu) {
    return null;
  }

  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: "high-performance"
  });

  if (!adapter) {
    return null;
  }

  const device = await adapter.requestDevice();
  const pixelCount = source.width * source.height;
  const inputPixels = new Uint32Array(
    source.data.buffer.slice(
      source.data.byteOffset,
      source.data.byteOffset + source.data.byteLength
    )
  );
  const inputBuffer = device.createBuffer({
    size: inputPixels.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  });
  const outputBuffer = device.createBuffer({
    size: pixelCount * Uint32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
  });
  const readBuffer = device.createBuffer({
    size: pixelCount * Uint32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
  });

  device.queue.writeBuffer(inputBuffer, 0, inputPixels);

  const shader = device.createShaderModule({
    label: "height-map-luminance",
    code: `
      @group(0) @binding(0) var<storage, read> inputPixels: array<u32>;
      @group(0) @binding(1) var<storage, read_write> outputValues: array<u32>;

      @compute @workgroup_size(64)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let index = id.x;
        if (index >= ${pixelCount}u) {
          return;
        }

        let pixel = inputPixels[index];
        let r = pixel & 255u;
        let g = (pixel >> 8u) & 255u;
        let b = (pixel >> 16u) & 255u;
        outputValues[index] = ((77u * r) + (150u * g) + (29u * b)) >> 8u;
      }
    `
  });

  const pipeline = device.createComputePipeline({
    label: "height-map-pipeline",
    layout: "auto",
    compute: {
      module: shader,
      entryPoint: "main"
    }
  });

  const bindGroup = device.createBindGroup({
    label: "height-map-bind-group",
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: inputBuffer } },
      { binding: 1, resource: { buffer: outputBuffer } }
    ]
  });

  const encoder = device.createCommandEncoder({ label: "height-map-command-encoder" });
  const pass = encoder.beginComputePass({ label: "height-map-compute-pass" });
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(Math.ceil(pixelCount / 64));
  pass.end();
  encoder.copyBufferToBuffer(
    outputBuffer,
    0,
    readBuffer,
    0,
    pixelCount * Uint32Array.BYTES_PER_ELEMENT
  );
  device.queue.submit([encoder.finish()]);

  await readBuffer.mapAsync(GPUMapMode.READ);
  const mapped = readBuffer.getMappedRange();
  const outputWords = new Uint32Array(mapped.slice(0));
  readBuffer.unmap();

  inputBuffer.destroy();
  outputBuffer.destroy();
  readBuffer.destroy();

  const output = new Uint8ClampedArray(pixelCount);
  for (let i = 0; i < outputWords.length; i += 1) {
    output[i] = outputWords[i] ?? 0;
  }

  return output;
}
