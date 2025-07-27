// jest.global-teardown.js
export default async () => {
  console.log('🧹 Cleaning up Jest global environment...');
  
  // Clean up test resources
  console.log('✅ Jest global teardown complete');
};
