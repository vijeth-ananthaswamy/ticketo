import express from 'express';

const router = express.Router();

router.post('/api/users/signout', (req, res, next) => {
  console.log('Destroying session...');
  req.session = null;
  res.send({});
});

export { router as signoutRouter };
