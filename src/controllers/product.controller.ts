import { Request, Response, NextFunction } from 'express';
import * as productService from '../services/product.service';
import { getPagination, paginationInfo } from '../utils/pagination';

export async function getProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const search = req.query.search as string | undefined;

    const { products, total } = await productService.getProducts(limit, offset, search);

    res.json({ data: products, ...paginationInfo(page, limit, total) });
  } catch (err) {
    next(err);
  }
}

export async function getProductById(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}
