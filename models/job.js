"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {

    static async create({ title, salary, equity, company_handle }) {
        const duplicateCheck = await db.query(
              `SELECT title
               FROM jobs
               WHERE title = $1`,
            [title]);
    
        if (duplicateCheck.rows[0]) {
            throw new BadRequestError(`Duplicate job: ${title}`);
        }
    
        const result = await db.query(
              `INSERT INTO jobs
               (title, salary, equity, company_handle)
               VALUES ($1, $2, $3, $4)
               RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [
              title,
              salary,
              equity,
              company_handle,
            ],
        );
    
        const job = result.rows[0];
    
        return job;
    }
    
      /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   * */

  static async findAll({ title, minSalary, hasEquity } = {}) {
    // Build your query based on the provided parameters
    let query = `
      SELECT id,
             title,
             salary,
             equity,
             company_handle AS "companyHandle"
      FROM jobs
    `;
  
    let values = [];
  
    // Add WHERE clauses based on the provided parameters
    if (title) {
      query += ` WHERE title ILIKE $1`;
      values.push(`%${title}%`);
    }
  
    if (minSalary) {
      query += values.length ? ` AND salary >= $${values.length + 1}` : ` WHERE salary >= $1`;
      values.push(minSalary);
    }
  
    if (hasEquity !== undefined) {
        query += values.length ? ` AND equity > 0` : ` WHERE equity > 0`;
      }
  
    // Execute the query
    const result = await db.query(query, values);
  
    return result.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"    
           FROM jobs
           WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns { id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data, 
        {
            title: "title",
            salary: "salary",
            equity: "equity",
            companyHandle: "company_handle",
          })
    const idIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${handle}`);

    return job;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
       FROM jobs
       WHERE id = $1
       RETURNING id`,
      [id]
    );
    const deletedId = result.rows[0];
  
    if (!deletedId) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;