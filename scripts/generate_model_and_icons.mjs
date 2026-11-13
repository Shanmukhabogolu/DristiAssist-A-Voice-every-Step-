import * as tf from '@tensorflow/tfjs';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('public/model');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Generating valid TensorFlow.js placeholder CNN model (128x128x3 -> 8 classes)...');

const model = tf.sequential();
model.add(tf.layers.conv2d({
  inputShape: [128, 128, 3],
  filters: 16,
  kernelSize: 3,
  activation: 'relu',
  padding: 'same'
}));
model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
model.add(tf.layers.conv2d({
  filters: 32,
  kernelSize: 3,
  activation: 'relu',
  padding: 'same'
}));
model.add(tf.layers.maxPooling2d({ poolSize: [2, 2] }));
model.add(tf.layers.flatten());
model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
model.add(tf.layers.dense({ units: 8, activation: 'softmax' }));

model.compile({
  optimizer: 'adam',
  loss: 'categoricalCrossentropy',
  metrics: ['accuracy']
});

// Use tf.io.withSaveHandler
const saveResult = await model.save(tf.io.withSaveHandler(async (artifacts) => {
  const modelTopology = artifacts.modelTopology;
  const weightSpecs = artifacts.weightSpecs;
  const weightData = artifacts.weightData;

  const weightsManifest = [{
    paths: ['weights.bin'],
    weights: weightSpecs
  }];

  const modelJson = {
    format: artifacts.format || 'layers-model',
    generatedBy: 'DrishtiAssist Placeholder Generator (TF.js)',
    convertedBy: 'DrishtiAssist ML Pipeline',
    modelTopology,
    weightsManifest
  };

  fs.writeFileSync(path.join(outDir, 'model.json'), JSON.stringify(modelJson, null, 2));
  if (weightData) {
    fs.writeFileSync(path.join(outDir, 'weights.bin'), Buffer.from(weightData));
  }
  return {
    modelArtifactsInfo: {
      dateSaved: new Date(),
      modelTopologyType: 'JSON',
      modelTopologyBytes: JSON.stringify(modelTopology).length,
      weightSpecsBytes: JSON.stringify(weightSpecs).length,
      weightDataBytes: weightData ? weightData.byteLength : 0
    }
  };
}));

console.log('Model saved successfully to public/model/model.json and weights.bin!');
