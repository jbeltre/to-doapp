import bodyParser from 'body-parser'
import 'dotenv/config'
import express, { Express, Request, Response } from 'express'
import path from 'path'
import { eq } from 'drizzle-orm'
import methodOverride from 'method-override'
import { db } from './db/db'
import { todos } from './db/schema'

const app: Express = express()
const port = process.env.PORT || 4000
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({ extended: false }))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// display new to-do page
app.get('/new', (req: Request, res: Response) => {
  res.render('new')
})

app.listen(port, () => {
  console.log(`🔥🔥🔥: Server is running at http://localhost:${port}`)
})
// save to-do to the database
app.post("/submit", async (req: Request, res: Response) => {
  try {
    const { title, description, dueDate, priority } = req.body;
    const values = { title, description, dueDate: new Date(dueDate), priority };
    const todo = await db.insert(todos).values(values).returning();

    res.status(201).redirect("/");
  } catch (error: any) {
    console.error(error.message);
    return res.status(500).send({
      error: `An error occurred while adding the To-Do: ${error.message}`,
    });
  }
});

app.get('/', async (req: Request, res: Response) => {
  const result = await db.select().from(todos)
  res.render('index', { todos: result })
})

// fetch a single to-do item from the database
app.get('/todo/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const todo = await db
      .select()
      .from(todos)
      .where(eq(todos.id, Number(id)))

    res.render('todo', { todo: todo[0] })
  } catch (error: any) {
    console.error(error.message)
    return res.status(500).send({
      error: `An error occurred while fetching the To-Do: ${error.message}`,
    })
  }
})
// update a to-do item
app.put('/submit/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { title, description, dueDate, priority, status } = req.body
    const values = {
      title,
      description,
      dueDate: new Date(dueDate),
      priority,
      status,
      completedAt: status === 'Completed' ? new Date() : null,
    }

    await db
      .update(todos)
      .set(values)
      .where(eq(todos.id, Number(id)))

    res.status(204).redirect('/')
  } catch (error: any) {
    console.error(error.message)
    return res.status(500).send({
      error: `An error occurred while updating the To-Do: ${error.message}`,
    })
  }
})