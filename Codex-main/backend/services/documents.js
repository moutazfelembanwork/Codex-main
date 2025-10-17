const { getPool, sql } = require('../config/database');

const baseSelect = `
  SELECT
    d.Id AS id,
    d.TraineeId AS traineeId,
    d.FileName AS fileName,
    d.DocumentType AS documentType,
    d.UploadDate AS uploadDate,
    d.FileSize AS fileSize,
    d.FileType AS fileType,
    d.Description AS description,
    d.UploadedBy AS uploadedBy,
    d.Status AS status,
    d.Version AS version,
    d.LastModified AS lastModified,
    t.Id AS trainee_id,
    t.EmployeeId AS trainee_employeeId,
    t.Status AS trainee_status,
    u.Id AS trainee_user_id,
    u.Email AS trainee_user_email,
    u.FullName AS trainee_user_name,
    up.Id AS uploader_id,
    up.Email AS uploader_email,
    up.FullName AS uploader_name,
    up.Role AS uploader_role
  FROM Documents d
  INNER JOIN Trainees t ON t.Id = d.TraineeId
  INNER JOIN Users u ON u.Id = t.UserId
  INNER JOIN Users up ON up.Id = d.UploadedBy
`;

const mapDocument = (row) => {
  if (!row) {
    return null;
  }

  const trainee = row.trainee_id
    ? {
        id: row.trainee_id,
        employeeId: row.trainee_employeeId,
        status: row.trainee_status,
        user: row.trainee_user_id
          ? {
              id: row.trainee_user_id,
              email: row.trainee_user_email,
              name: row.trainee_user_name,
            }
          : null,
      }
    : null;

  const uploader = row.uploader_id
    ? {
        id: row.uploader_id,
        email: row.uploader_email,
        name: row.uploader_name,
        role:
          typeof row.uploader_role === 'string'
            ? row.uploader_role.toLowerCase()
            : row.uploader_role,
      }
    : null;

  return {
    id: row.id,
    traineeId: row.traineeId,
    fileName: row.fileName,
    documentType: row.documentType,
    uploadDate: row.uploadDate,
    fileSize: row.fileSize,
    fileType: row.fileType,
    description: row.description,
    uploadedBy: row.uploadedBy,
    status: typeof row.status === 'string' ? row.status.toLowerCase() : row.status,
    version: row.version,
    lastModified: row.lastModified,
    trainee,
    uploader,
  };
};

const getDocuments = async (filters = {}) => {
  const pool = await getPool();
  const request = pool.request();
  const clauses = [];

  if (filters.traineeId) {
    clauses.push('d.TraineeId = @TraineeId');
    request.input('TraineeId', sql.Int, filters.traineeId);
  }

  if (filters.documentType) {
    clauses.push('d.DocumentType = @DocumentType');
    request.input('DocumentType', sql.NVarChar, filters.documentType);
  }

  const query = `${baseSelect}${clauses.length ? ` WHERE ${clauses.join(' AND ')}` : ''} ORDER BY d.Id`;
  const result = await request.query(query);
  return result.recordset.map(mapDocument);
};

const getDocumentById = async (id) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('Id', sql.Int, id)
    .query(`${baseSelect} WHERE d.Id = @Id`);

  return mapDocument(result.recordset[0]);
};

const createDocument = async ({
  traineeId,
  fileName,
  documentType,
  fileSize,
  fileType,
  description,
  uploadedBy,
  status,
  version,
}) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('TraineeId', sql.Int, traineeId)
    .input('FileName', sql.NVarChar, fileName)
    .input('DocumentType', sql.NVarChar, documentType ?? 'other')
    .input('FileSize', sql.NVarChar, fileSize ?? 'N/A')
    .input('FileType', sql.NVarChar, fileType ?? 'application/octet-stream')
    .input('Description', sql.NVarChar, description ?? '')
    .input('UploadedBy', sql.Int, uploadedBy)
    .input('Status', sql.NVarChar, status ?? 'active')
    .input('Version', sql.NVarChar, version ?? '1.0')
    .query(`
      INSERT INTO Documents (TraineeId, FileName, DocumentType, FileSize, FileType, Description, UploadedBy, Status, Version)
      OUTPUT INSERTED.Id
      VALUES (@TraineeId, @FileName, @DocumentType, @FileSize, @FileType, @Description, @UploadedBy, @Status, @Version)
    `);

  return getDocumentById(result.recordset[0].Id);
};

const updateDocument = async (id, fields) => {
  const pool = await getPool();
  const updates = [];
  const request = pool.request().input('Id', sql.Int, id);

  if (fields.fileName) {
    updates.push('FileName = @FileName');
    request.input('FileName', sql.NVarChar, fields.fileName);
  }

  if (fields.documentType) {
    updates.push('DocumentType = @DocumentType');
    request.input('DocumentType', sql.NVarChar, fields.documentType);
  }

  if (fields.description !== undefined) {
    updates.push('Description = @Description');
    request.input('Description', sql.NVarChar, fields.description ?? '');
  }

  if (fields.status) {
    updates.push('Status = @Status');
    request.input('Status', sql.NVarChar, fields.status);
  }

  if (fields.version) {
    updates.push('Version = @Version');
    request.input('Version', sql.NVarChar, fields.version);
  }

  if (!updates.length) {
    return getDocumentById(id);
  }

  updates.push('LastModified = SYSUTCDATETIME()');

  await request.query(`
    UPDATE Documents
    SET ${updates.join(', ')}
    WHERE Id = @Id
  `);

  return getDocumentById(id);
};

const deleteDocument = async (id) => {
  const pool = await getPool();
  await pool.request().input('Id', sql.Int, id).query('DELETE FROM Documents WHERE Id = @Id');
};

const getDocumentStats = async () => {
  const pool = await getPool();
  const totalQuery = 'SELECT COUNT(*) AS total FROM Documents';
  const typeQuery = 'SELECT DocumentType AS label, COUNT(*) AS count FROM Documents GROUP BY DocumentType';
  const statusQuery = 'SELECT Status AS label, COUNT(*) AS count FROM Documents GROUP BY Status';

  const [totalResult, typeResult, statusResult] = await Promise.all([
    pool.request().query(totalQuery),
    pool.request().query(typeQuery),
    pool.request().query(statusQuery),
  ]);

  return {
    total: totalResult.recordset[0]?.total ?? 0,
    byType: Object.fromEntries(typeResult.recordset.map((row) => [row.label, row.count])),
    byStatus: Object.fromEntries(statusResult.recordset.map((row) => [row.label, row.count])),
  };
};

module.exports = {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentStats,
  mapDocument,
};
