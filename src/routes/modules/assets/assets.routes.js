const express = require('express');
const { AssetsController } = require('./assets.controller');
const router = express.Router();

router.get('/', AssetsController.list);
router.get('/:idAsset', AssetsController.get);
router.post('/', AssetsController.create);
router.put('/:idAsset', AssetsController.update);
router.delete('/:idAsset', AssetsController.delete);

module.exports = router;