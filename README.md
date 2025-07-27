# 🛡️ SmartVault Backend - Production Grade Node.js API

[![Deploy to PM2 server](https://github.com/pallabcodes/nodejs/actions/workflows/deploy.yml/badge.svg)](https://github.com/pallabcodes/nodejs/actions/workflows/deploy.yml)
[![Security Rating](https://img.shields.io/badge/security-A%2B-brightgreen)](./SECURITY.md)
[![Code Coverage](https://img.shields.io/badge/coverage-80%25-green)](./coverage)
[![Node Version](https://img.shields.io/badge/node-18.x-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-ISC-blue)](./LICENSE)

## 🚀 **Enterprise-Grade Node.js Backend**

A production-ready, scalable Node.js backend API built with **functional programming principles**, comprehensive security, and enterprise-grade architecture patterns.

---

## ✨ **Key Features**

### 🏗️ **Architecture**
- **Functional Middleware Composition**: Pure, composable middleware pipeline
- **Domain-Driven Design**: Modular architecture with clear boundaries
- **Clean Code Principles**: SOLID principles and design patterns
- **Microservice Ready**: Stateless, containerized, cloud-native

### 🔒 **Security First**
- **Authentication**: JWT with refresh tokens and secure defaults
- **Authorization**: RBAC, PBAC, ReBAC with fine-grained permissions
- **Input Validation**: Comprehensive validation with Joi/Yup schemas
- **Security Headers**: CSP, HSTS, X-Frame-Options via Helmet.js
- **Rate Limiting**: Advanced rate limiting with Redis backing
- **SQL Injection Prevention**: Parameterized queries with Sequelize ORM
- **XSS Protection**: Input sanitization and output encoding

### 📊 **Observability & Monitoring**
- **Structured Logging**: JSON logs with correlation IDs
- **Application Performance Monitoring**: Custom APM integration
- **Health Checks**: Comprehensive health endpoints
- **Metrics Collection**: Performance and business metrics
- **Error Tracking**: Centralized error handling and reporting

### 🚀 **Performance & Scalability**
- **Caching Strategy**: Multi-layer caching with Redis
- **Database Optimization**: Connection pooling and query optimization
- **Compression**: Gzip/Brotli response compression
- **Load Testing**: Performance benchmarks and optimization
- **Horizontal Scaling**: Stateless design for easy scaling
sequelize db:migrate:undo --name create_users_table

# To rollback all the migrations:
sequelize db:migrate:undo:all

# To create seeder:
sequelize seed:generate --name create_users_seeder

# To run seeder:
sequelize db:seed:all

# To run seeder for a specific env:
sequelize db:seed --env staging

# To run specific seeder:
sequelize db:seed --seed create_users_seeder

# To rollback the last batch of seeder:
sequelize db:seed:undo

# To rollback specific seeder:
sequelize db:seed:undo --seed create_users_seeder

# To rollback all the seeders:
sequelize db:seed:undo:all

# To run migrations with seeders:
sequelize db:migrate && sequelize db:seed:all

# If sequelize cli not installed globally:
npx sequelize-cli
instead of
sequelize
# crowdfunding-backend
