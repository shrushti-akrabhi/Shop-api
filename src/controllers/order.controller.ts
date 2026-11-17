import { Request, Response, NextFunction } from 'express';
import * as orderService from '../services/order.service';
import { getPagination, paginationInfo } from '../utils/pagination';


export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { shipping_address, items } = req.body;
    // user id comes from the token (req.user), never from the body
    const order = await orderService.createOrder(req.user!.userId, shipping_address, items);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}


export async function getMyOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { orders, total } = await orderService.getMyOrders(req.user!.userId, limit, offset);
    res.json({ data: orders, ...paginationInfo(page, limit, total) });
  } catch (err) {
    next(err);
  }
}

export async function getAllOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { orders, total } = await orderService.getAllOrders(limit, offset);
    res.json({ data: orders, ...paginationInfo(page, limit, total) });
  } catch (err) {
    next(err);
  }
}


export async function getOrderById(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user!.userId, req.user!.role);
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await orderService.updateOrderStatus(req.params.id, req.body.status);
    res.json(order);
  } catch (err) {
    next(err);
  }
}
