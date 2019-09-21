// This function will refresh the refresh_token when the access token updated after 15 mins.
import { Response } from "express";

export const updateRefreshToken = (res: Response, token: string) => {
  res.cookie("_jimtcour", token, {
    httpOnly: true,
    path: "/refresh_token"
  });
};
