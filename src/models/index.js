'use strict';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize } from 'sequelize';
import { dirname } from 'path';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

// Read config from JSON file
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/config.json'), 'utf8'))[env];

const db = {};

let sequelize;

if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Function to get all model files recursively
const getModelFiles = (dir) => {
  const files = fs.readdirSync(dir);
  const modelFiles = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // If it's a directory, check if it's a models directory
      if (file === 'models') {
        const modelDirFiles = fs.readdirSync(filePath)
          .filter(f => f.endsWith('.js') && !f.endsWith('.test.js'))
          .map(f => path.join(filePath, f));
        modelFiles.push(...modelDirFiles);
      } else {
        // Recursively search other directories
        modelFiles.push(...getModelFiles(filePath));
      }
    }
  }

  return modelFiles;
};

// Get model files from both src/models and src/modules
const modelFiles = [
  // Models in src/models
  ...fs.readdirSync(__dirname)
    .filter(file => {
      return (
        file.indexOf('.') !== 0 &&
        file !== basename &&
        file.slice(-3) === '.js' &&
        file.indexOf('.test.js') === -1
      );
    })
    .map(file => path.join(__dirname, file)),
  // Models in src/modules/*/models
  ...getModelFiles(path.join(__dirname, '../modules'))
];

// Import all models
for (const file of modelFiles) {
  const fileUrl = `file://${file.replace(/\\/g, '/')}`;
  const model = await import(fileUrl);
  const modelInstance = model.default(sequelize, Sequelize.DataTypes);
  db[modelInstance.name] = modelInstance;
}

// Set up associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
