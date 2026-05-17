import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // This will fail until the 'todos' table is created, but serves as a connection test
  const { data: todos, error } = await supabase.from('todos').select()

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-500">Connection Error</h1>
        <pre className="mt-4 p-4 bg-gray-100 rounded">{JSON.stringify(error, null, 2)}</pre>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Todos (Supabase Test)</h1>
      <ul className="space-y-2">
        {todos?.map((todo: any) => (
          <li key={todo.id} className="p-2 border rounded shadow-sm">
            {todo.name}
          </li>
        ))}
        {todos?.length === 0 && <p className="text-gray-500">No todos found. Create a 'todos' table in Supabase to see data.</p>}
      </ul>
    </div>
  )
}
