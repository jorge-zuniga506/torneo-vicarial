import type { NextFunction, Request, Response } from 'express'

type Handler<Req extends Request = Request> = (
  req: Req,
  res: Response,
  next: NextFunction,
) => Promise<unknown>

/** Envuelve un handler async para que sus rechazos lleguen al error handler central. */
export function asyncHandler<Req extends Request = Request>(fn: Handler<Req>) {
  return (req: Req, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}
