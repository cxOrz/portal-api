#  Portal-api

## 接口
返回内容类型：Content-Type: application/json

返回数据的结构：`{ code: <number>, data:<Object | Array> }`

访问某些接口若无权限，将返回 `{ code: 401, data: '无权限操作'}`

> 概览表。具体传的参数，返回的内容，懒得写。

| Method | URL                           | code(成功\|失败)      | data (成功\|失败)                                                                     |
| ------ | ----------------------------- | --------------------- | ------------------------------------------------------------------------------------- |
| GET    | /api/user                     | 200 <br> 500          | Object\<User\> <br> String\<内部错误\>                                                |
| GET    | /api/user/verification/:email | 201 <br> 400 <br> 500 | String\<成功\> <br> String\<已被使用\> <br> String\<内部错误\>                        |
| POST   | /api/user/create              | 201 <br> 400 <br> 500 | String\<成功\> <br> String\<验证失败\> <br> String\<内部错误\>                        |
| POST   | /api/user/update              | 201 <br> 400 <br> 500 | String\<成功\> <br> String\<找不到该数据\> <br> String\<内部错误\>                    |
| POST   | /api/user/upload              | 201 <br> 400 <br> 500 | String\<URL\> <br> String\<未指定类型\> <br> String\<内部错误\>                       |
| POST   | /api/user/login               | 200 <br> 400 <br> 500 | Object\<User\> <br> String\<登录失败\> <br> String\<内部错误\>                        |
| POST   | /api/blog/create              | 201 <br> 500          | String\<成功\> <br> String\<内部错误\>                                                |
| POST   | /api/blog/update              | 201 <br> 400 <br> 500 | String\<成功\> <br> String\<找不到该数据\> <br> String\<内部错误\>                    |
| DELETE | /api/blog/:id                 | 204 <br> 400 <br> 500 | String\<成功\> <br> String\<找不到该数据\> <br> String\<内部错误\>                    |
| GET    | /api/blog/list                | 200 <br> 500          | Array\<{ _id, title }\> <br> String\<内部错误\>                                       |
| GET    | /api/blog/:id                 | 200 <br> 404 <br> 500 | Object\<Blog\> <br> String\<找不到该数据\> <br> String\<内部错误\>                    |
| GET    | /api/blog                     | 200 <br> 500          | Array\<Blog\> <br> String\<内部错误\>                                                 |
| POST   | /api/order/create             | 201 <br> 500          | String\<成功\> <br> String\<内部错误\>                                                |
| GET    | /api/order                    | 200 <br> 404 <br> 500 | Object\<Order\> \| Array\<Order\> <br> String\<找不到该数据\> <br> String\<内部错误\> |
| POST   | /api/order/sendmsg            | 201 <br> 404 <br> 500 | String\<成功\> <br> String\<找不到该数据\> <br> String\<内部错误\>                    |
| POST   | /api/order/update             | 201 <br> 404 <br> 500 | String\<成功\> <br> String\<找不到该数据\> <br> String\<内部错误\>                    |
| DELETE | /api/order/:id                | 204 <br> 400 <br> 500 | String\<成功\> <br> String\<找不到该数据\> <br> String\<内部错误\>                    |