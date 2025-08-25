import { Request, Response } from 'express';
import { UsersService } from './users.service';

export const UsersController = {
  list: async (_req: Request, res: Response) => {
    const users = await UsersService.list();
    res.json(users);
  },

  get: async (req: Request, res: Response) => {
    const { email } = req.params;
    const user = await UsersService.get(email);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  },

  create: async (req: Request, res: Response) => {
    const { email, name, password, status } = req.body ?? {};
    if (!email || !name || !password) {
      return res.status(400).json({ message: 'email, name y password son obligatorios' });
    }
    try {
      const created = await UsersService.create({ email, name, password, status });
      res.status(201).json(created);
    } catch (e: any) {
      // Prisma unique violation
      if (e?.code === 'P2002') return res.status(409).json({ message: 'El email ya existe' });
      throw e;
    }
  },

  update: async (req: Request, res: Response) => {
    const { email } = req.params;
    const { name, status, password } = req.body ?? {};
    try {
      const updated = await UsersService.update(email, { name, status, password });
      res.json(updated);
    } catch (e: any) {
      if (e?.code === 'P2025') return res.status(404).json({ message: 'Usuario no encontrado' });
      throw e;
    }
  },

  updateStatus: async (req: Request, res: Response) => {
    const { email } = req.params;
    const { status } = req.body ?? {};
    if (!status) return res.status(400).json({ message: 'status es obligatorio' });
    try {
      const updated = await UsersService.updateStatus(email, status);
      res.json(updated);
    } catch (e: any) {
      if (e?.code === 'P2025') return res.status(404).json({ message: 'Usuario no encontrado' });
      throw e;
    }
  },

  updatePassword: async (req: Request, res: Response) => {
    const { email } = req.params;
    const { password } = req.body ?? {};
    if (!password) return res.status(400).json({ message: 'password es obligatorio' });
    try {
      const updated = await UsersService.updatePassword(email, password);
      res.json(updated);
    } catch (e: any) {
      if (e?.code === 'P2025') return res.status(404).json({ message: 'Usuario no encontrado' });
      throw e;
    }
  },

  remove: async (req: Request, res: Response) => {
    const { email } = req.params;
    try {
      await UsersService.delete(email);
      res.status(204).send();
    } catch (e: any) {
      if (e?.code === 'P2025') return res.status(404).json({ message: 'Usuario no encontrado' });
      throw e;
    }
  },
};
