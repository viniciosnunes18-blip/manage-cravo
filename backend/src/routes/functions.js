const router = require('express').Router();

const fnMap = {
  ativarRevendedora: require('../functions/ativarRevendedora'),
  notificarNovoCadastro: require('../functions/notificarNovoCadastro'),
  processarPontosGamificacao: require('../functions/processarPontosGamificacao'),
};

router.all('/:name', async (req, res) => {
  const { name } = req.params;
  const fn = fnMap[name];
  if (!fn) return res.status(404).json({ error: `Function '${name}' not found` });
  try {
    const result = await fn(req.body || {});
    res.json(result || { success: true });
  } catch (e) {
    console.error(`[function:${name}]`, e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
