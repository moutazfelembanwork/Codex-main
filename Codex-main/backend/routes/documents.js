const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentStats,
} = require('../services/documents');
const { getTraineeByUserId } = require('../services/trainees');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const filters = {};

    if (req.query.traineeId) {
      filters.traineeId = Number(req.query.traineeId);
    }

    if (req.query.documentType) {
      filters.documentType = req.query.documentType;
    }

    if (req.user.role === 'trainee') {
      const traineeRecord = req.user.traineeId
        ? { id: req.user.traineeId }
        : await getTraineeByUserId(req.user.id);

      if (!traineeRecord) {
        return res.json({ success: true, data: [] });
      }

      filters.traineeId = traineeRecord.id;
    }

    const data = await getDocuments(filters);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Fetch documents error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await getDocumentStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Document stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id, 10);
    const document = await getDocumentById(documentId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json({ success: true, data: document });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const traineeId = req.body.traineeId;
    const fileName = req.body.fileName;

    if (!traineeId || !fileName) {
      return res.status(400).json({ message: 'Trainee and file name are required' });
    }

    const document = await createDocument({
      traineeId: Number(traineeId),
      fileName,
      documentType:
        typeof req.body.documentType === 'string'
          ? req.body.documentType.toLowerCase()
          : undefined,
      fileSize: req.body.fileSize,
      fileType: req.body.fileType,
      description: req.body.description,
      uploadedBy: req.user.id,
      status:
        typeof req.body.status === 'string' ? req.body.status.toLowerCase() : undefined,
      version: req.body.version,
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document,
    });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id, 10);
    const document = await getDocumentById(documentId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (req.user.role === 'trainee' && req.user.id !== document.uploadedBy) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const updated = await updateDocument(documentId, {
      fileName: req.body.fileName,
      description: req.body.description,
      documentType:
        typeof req.body.documentType === 'string'
          ? req.body.documentType.toLowerCase()
          : undefined,
      status:
        typeof req.body.status === 'string' ? req.body.status.toLowerCase() : undefined,
      version: req.body.version,
    });

    res.json({
      success: true,
      message: 'Document updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, requireRole(['admin', 'advisor']), async (req, res) => {
  try {
    const documentId = parseInt(req.params.id, 10);
    const document = await getDocumentById(documentId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    await deleteDocument(documentId);

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
