//67130500001 - Practice Student
import mysql from 'mysql2/promise'

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'classicmodels',
})
export default db