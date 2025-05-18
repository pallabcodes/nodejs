# 🧩 Functional Middleware Architecture for Node.js

![Deploy to PM2 server](https://github.com/pallabcodes/nodejs/actions/workflows/deploy.yml/badge.svg)

# express-node-mysql
Local: npm start
Server: pm2 start --name "project-name"

# To install sequelize cli globally:
npm install -g sequelize-cli

# To create a table via migration:
sequelize migration:create --name create_users_table

# To add fields in a existing table:
sequelize migration:generate --name add_fields_to_users

# To run migration:
sequelize db:migrate

# To run migration for a specific env:
sequelize db:migrate --env staging

# To run specific migration:
sequelize db:migrate --name create_users_table

# To rollback the last batch of migration:
sequelize db:migrate:undo

# To rollback the specific migration:
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
