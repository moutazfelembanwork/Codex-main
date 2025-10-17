const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../config/database');

const baseSelect = `
  SELECT
    u.Id AS id,
    u.Email AS email,
    u.PasswordHash AS passwordHash,
    u.FullName AS name,
    u.Role AS role,
    u.Department AS department,
    u.PhoneNumber AS phoneNumber,
    u.IsActive AS isActive,
    u.CreatedAt AS createdAt,
    u.LastLogin AS lastLogin,
    t.Id AS traineeId,
    t.Status AS traineeStatus,
    t.StartDate AS startDate,
    t.EndDate AS endDate
  FROM Users u
  LEFT JOIN Trainees t ON t.UserId = u.Id
`;

const mapUser = (row, { includePassword } = {}) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: typeof row.role === 'string' ? row.role.toLowerCase() : 'trainee',
    department: row.department,
    phoneNumber: row.phoneNumber,
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt,
    lastLogin: row.lastLogin,
    traineeId: row.traineeId ?? null,
    traineeStatus: row.traineeStatus ?? null,
    startDate: row.startDate ?? null,
    endDate: row.endDate ?? null,
    ...(includePassword ? { passwordHash: row.passwordHash } : {}),
  };
};

const getUsers = async () => {
  const pool = await getPool();
  const result = await pool.request().query(`${baseSelect} ORDER BY u.Id`);
  return result.recordset.map(mapUser);
};

const getUserById = async (id) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .query(`${baseSelect} WHERE u.Id = @Id`);

  return mapUser(result.recordset[0]);
};

const getUserByEmail = async (email) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('Email', sql.NVarChar, email)
    .query(`${baseSelect} WHERE LOWER(u.Email) = LOWER(@Email)`);

  return mapUser(result.recordset[0]);
};

const getAuthUserByEmail = async (email) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('Email', sql.NVarChar, email)
    .query(`${baseSelect} WHERE LOWER(u.Email) = LOWER(@Email)`);

  return mapUser(result.recordset[0], { includePassword: true });
};

const createUser = async ({ email, password, name, role, department, phoneNumber }) => {
  const pool = await getPool();
  const passwordHash = await bcrypt.hash(password, 10);

  const result = await pool
    .request()
    .input('Email', sql.NVarChar, email)
    .input('PasswordHash', sql.NVarChar, passwordHash)
    .input('FullName', sql.NVarChar, name)
    .input('Role', sql.NVarChar, role)
    .input('Department', sql.NVarChar, department)
    .input('PhoneNumber', sql.NVarChar, phoneNumber)
    .query(`
      INSERT INTO Users (Email, PasswordHash, FullName, Role, Department, PhoneNumber)
      OUTPUT INSERTED.Id
      VALUES (@Email, @PasswordHash, @FullName, @Role, @Department, @PhoneNumber)
    `);

  return getUserById(result.recordset[0].Id);
};

const updateUser = async (id, fields) => {
  const pool = await getPool();
  const updates = [];
  const request = pool.request().input('Id', sql.Int, id);

  if (typeof fields.name === 'string') {
    updates.push('FullName = @FullName');
    request.input('FullName', sql.NVarChar, fields.name);
  }

  if (typeof fields.department === 'string') {
    updates.push('Department = @Department');
    request.input('Department', sql.NVarChar, fields.department);
  }

  if (typeof fields.phoneNumber === 'string') {
    updates.push('PhoneNumber = @PhoneNumber');
    request.input('PhoneNumber', sql.NVarChar, fields.phoneNumber);
  }

  if (typeof fields.lastLogin === 'string') {
    updates.push('LastLogin = @LastLogin');
    request.input('LastLogin', sql.DateTime2, fields.lastLogin);
  }

  if (fields.isActive !== undefined) {
    updates.push('IsActive = @IsActive');
    request.input('IsActive', sql.Bit, fields.isActive);
  }

  if (!updates.length) {
    return getUserById(id);
  }

  await request.query(`
    UPDATE Users
    SET ${updates.join(', ')}
    WHERE Id = @Id
  `);

  return getUserById(id);
};

module.exports = {
  getUsers,
  getUserById,
  getUserByEmail,
  getAuthUserByEmail,
  createUser,
  updateUser,
};
