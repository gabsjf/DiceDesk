import express from 'express';
import path from 'path';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';

const app = express();

// Configurações do EJS para as views
app.set('view engine', 'ejs');
app.set('views', path.resolve('./src/views'));

// Middleware para arquivos estáticos (CSS, JS)
app.use(express.static(path.resolve('./public')));
app.use(express.urlencoded({ extended: true }));

// Middleware para processar cookies e CSRF
app.use(cookieParser());
app.use(csurf({ cookie: true }));

// Middleware para passar o CSRF token e o flash para as views
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

// Configuração do Multer para upload de arquivos
const upload = multer({ dest: 'public/uploads/' });

// Simulação de dados (futuramente virão do banco de dados)
const campanhas = [
  { id: '1', nome: 'A Crônica do Reino Perdido', sistema: 'Dungeons & Dragons 5e', descricao: '...', capaUrl: '/images/campanha-placeholder.png', sessoes: [] },
  { id: '2', nome: 'A Ascensão de Cthulhu', sistema: 'Chamado de Cthulhu', descricao: '...', capaUrl: '/images/campanha-placeholder.png', sessoes: [] },
];

// Rota GET para renderizar a página de detalhes da campanha
app.get('/campanhas/:id', (req, res) => {
  const campanha = campanhas.find(c => c.id === req.params.id);
  if (!campanha) {
    return res.status(404).send('Campanha não encontrada');
  }
  res.render('campanha/detalhes', { campanha });
});

// Rota POST para criar uma nova sessão
app.post('/sessoes/criar', upload.single('imagem'), (req, res) => {
  const { nome, campanhaId } = req.body;
  const imagem = req.file;

  console.log('--- Nova Sessão ---');
  console.log('Nome:', nome);
  console.log('ID da Campanha:', campanhaId);
  console.log('Arquivo:', imagem);

  // Aqui você adicionaria a lógica para salvar a nova sessão no banco de dados

  // Redireciona de volta para a página de detalhes da campanha
  res.redirect(`/campanhas/${campanhaId}`);
});

export default app;