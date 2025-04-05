FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production 
RUN npm install cors
RUN npm install node-vault
RUN npm install jsonwebtoken
RUN npm install speakeasy
RUN npm install qrcode
RUN npm install joi
RUN npm install express-rate-limit
RUN npm install nodemailer
RUN npm install googleapis
RUN npm install google-auth-library

COPY . .

RUN mkdir -p /usr/src/app/data

EXPOSE 3000

CMD ["npm", "node"]