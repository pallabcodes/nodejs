// src/modules/users/controllers.js
let users = [];

const createUser = async (req, res) => {
  const user = { id: users.length + 1, ...req.body };
  users.push(user);
  res.status(201).json({ data: user });
};

const getUsers = async (req, res) => {
  res.status(200).json({ data: users });
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  users = users.filter(u => u.id !== parseInt(id));
  res.status(204).end();
};

module.exports = { createUser, getUsers, deleteUser };
