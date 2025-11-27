// /memory-engine/routes/index.js

import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// Dynamically load all routers in routes/api and routes/admin
const loadRoutes = (dir, basePath = '/') => {
  const fullPath = path.join(process.cwd(), 'routes', dir);
  if (!fs.existsSync(fullPath)) return;

  const files = fs.readdirSync(fullPath);
  files.forEach((file) => {
    if (file.endsWith('.js')) {
      const routePath = path.join('routes', dir, file);
      import(`../${dir}/${file}`).then((module) => {
        const mountPath = basePath + file.replace('.js', '');
        console.log(`✅ Mounting ${mountPath} -> ${routePath}`);
        router.use(mountPath, module.default);
      });
    }
  });
};

// Load API and Admin Routes
loadRoutes('api', '/api/');
loadRoutes('admin', '/api/admin/');

export default router;