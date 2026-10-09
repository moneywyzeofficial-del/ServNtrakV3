export const DEFAULT_USER = {
  id: "45324416",
  email: "tiago@servntrak.pt",
  username: "tiago",
  firstName: "Tiago",
  lastName: "Santos",
  profileImageUrl: null,
  provider: "local",
};

export const requireAuth = (req: any, res: any, next: any) => {
  req.user = req.user || DEFAULT_USER;
  return next();
};
