// jest.global-setup.js
export default async () => {
  console.log('🧪 Setting up Jest global environment...');
  
  // Setup test database
  process.env.DATABASE_URL = 'sqlite::memory:';
  process.env.NODE_ENV = 'test';
  
  // Additional global setup can go here
  console.log('✅ Jest global setup complete');
};
