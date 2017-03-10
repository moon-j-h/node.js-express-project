# node.js-project
node.js - express 를 사용한 server project
: 이미지, 영상, 텍스트를 공유하고 전시 공간을 찾는 APP

## Technical Stacks
- Programming Language : Javascript 
- Framework : node.js(express) 
- Database : Mongodb
- Cloud/Infra : AWS(EC2, S3)

## Web Service Architecture
 - RESTful
 
## Features
- 회원가입/로그인/로그아웃 (crypto-비밀번호 암호화, passport, express-session)
- session : mongodb에 저장
- 이미지, 텍스트 업로드 및 공유(formidable, S3)
- 권한 인증(auth middleware)

