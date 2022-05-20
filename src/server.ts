import { Request, Response } from 'express';
import express from 'express';
import bodyParser from 'body-parser';
import { filterImageFromURL, deleteLocalFiles } from './util/util';
import { config } from './config/config';
import { NextFunction } from 'connect';
import * as jwt from 'jsonwebtoken';

(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;

  // Use the body parser middleware for post requests
  app.use(bodyParser.json());


  function authenticate(req: Request, res: Response, next: NextFunction) {
    if (!req.headers || !req.headers.authorization) {
      return res.status(401).send({ message: 'Authorization header missing' });
    }

    const token = req.headers.authorization.split(' ');
    if (token.length < 2) {
      return res.status(401).send({ message: 'token invalid' });
    }

    return jwt.verify(token[1], config.jwt.secret, (err, decoded) => {
      if (err) {
        return res.status(500).send({ auth: false, message: 'Authenticate failed.' });
      }
      req.body.decoded = decoded;
      return next();
    });
  }

  // @TODO1 IMPLEMENT A RESTFUL ENDPOINT
  // GET /filteredimage?image_url={{URL}}
  app.get("/filteredimage",
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      const { image_url } = req.query;
      if (!image_url) {
        res.status(400).send({ message: 'image_url is required or malformed' });
        return;
      }

      const filteredImg: string = await filterImageFromURL(image_url);
      res.sendFile(filteredImg, {}, error => {
        if (error) {
          res.status(500).send({ message: 'could not proccess file request' });
        } else {
          deleteLocalFiles([filteredImg]);
        }
      });
    });

  app.get("/genToken", async (req: Request, res: Response) => {
    const { name } = req.query;
    if (!name) {
      res.status(400).send({ message: 'name is required or malformed' });
      return;
    }
    res.status(201).send({ token: jwt.sign(name, config.jwt.secret) })
  });

  /**************************************************************************** */

  //! END @TODO1

  // Root Endpoint
  // Displays a simple message to the user
  app.get("/", async (req: Request, res: Response) => {
    res.send("try GET /filteredimage?image_url={{}}")
  });


  // Start the Server
  app.listen(port, () => {
    console.log(`server running http://localhost:${port}`);
    console.log(`press CTRL+C to stop server`);
  });
})();