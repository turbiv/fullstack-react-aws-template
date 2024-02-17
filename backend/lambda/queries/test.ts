import {Client} from "pg";

const clientConfig = {
  host: "test.eu-west-1.rds.amazonaws.com",
  database: "test",
  user: "postgres",
  password: "test",
  port: 5432,
  ssl: false
}

const setHeaders = (data: any) => {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    body: data,
  };
}

export const getTest = async (params: {id: string}) => {
  const client = new Client(clientConfig)
  await client.connect()
  const res = await client.query(`SELECT * FROM "test" WHERE id = '${params.id}';`)
  await client.end()
  return setHeaders({rows: res.rows, count: res.rowCount})
}
