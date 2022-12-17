import { useEffect, useState } from "react";
import { DataStore } from "@aws-amplify/datastore";
import { Todo } from "./models";
import { Amplify } from "aws-amplify";
import awsconfig from "./aws-exports";

Amplify.configure(awsconfig);

function App() {
	// new todo state
	const [newTodo, setNewTodo] = useState({
		name: "",
		description: ""
	});
	// all todos state
	const [allTodos, setAllTodos] = useState([]);
	// single todo state for updating todo
	const [singleTodo, setSingleTodo] = useState({});
	// setting state to update status
	const [updateState, setUpdateState] = useState(false);

	// FUNCTIONS
	// function to get all todos
	const getTodos = async () => {
		const todos = await DataStore.query(Todo);
		setAllTodos(todos);
	};

	// get all todos on page load
	useEffect(() => {
		getTodos();
	}, []);

	// create todo on change
	const onChangeTodo = (e) => {
		if (!updateState) {
			setNewTodo({
				...newTodo,
				[e.target.name]: e.target.value
			});
		} else if (updateState) {
			setSingleTodo({
				...singleTodo,
				[e.target.name]: e.target.value
			});
		}
	};

	// create todo on submit
	const submitTodo = async (e) => {
		e.preventDefault();
		if (
			updateState &&
			(singleTodo.name === "" || singleTodo.description === "")
		)
			return;

		if (!updateState && (newTodo.name === "" || newTodo.description === ""))
			return;

		if (!updateState) {
			await DataStore.query(Todo);
			const addedTodo = await DataStore.save(
				new Todo({
					name: newTodo.name,
					description: newTodo.description
				})
			);
			setAllTodos([...allTodos, addedTodo]);
		} else if (updateState) {
			const original = await DataStore.query(Todo, singleTodo.id);
			await DataStore.save(
				Todo.copyOf(original, (item) => {
					item.name = singleTodo.name;
					item.description = singleTodo.description;
					item.id = singleTodo.id;
				})
			);
			getTodos();
			setUpdateState(false);
		}
		setNewTodo({
			name: "",
			description: ""
		});
	};

	//	get single todo to update
	const getSingleTodo = async (id) => {
		setUpdateState(true);
		const original = await DataStore.query(Todo, id);
		setSingleTodo(original);
	};

	// delete todo
	const deleteTodo = async (id) => {
		let confirmDelete = window.confirm(
			"Are you sure you want to delete this todo?"
		);
		if (confirmDelete) {
			await DataStore.delete(Todo, id);
			setAllTodos(allTodos.filter((todo) => todo.id !== id));
		} else return;
	};

	return (
		<main className="lg:p-10">
			<div className="container mx-auto flex flex-col lg:flex lg:flex-row lg:items-start">
				<div className="w-full lg:w-5/12 p-2">
					<form
						onSubmit={submitTodo}
						className="border rounded-md flex flex-col p-2">
						<input
							className="border rounded-md p-2 mb-2"
							type="text"
							placeholder="Todo Name"
							name="name"
							value={updateState ? singleTodo.name || "" : newTodo.name || ""}
							onChange={onChangeTodo}
						/>
						<input
							className="border rounded-md p-2 mb-2"
							type="text"
							name="description"
							placeholder="Todo Description"
							value={
								updateState
									? singleTodo.description || ""
									: newTodo.description || ""
							}
							onChange={onChangeTodo}
						/>
						<input
							className="mt-2 bg-gray-200 border rounded-md p-2 cursor-pointer"
							type="submit"
							value={updateState ? "Update Todo" : "Add Todo"}
						/>
					</form>
				</div>
				<div className="w-full lg:w-7/12">
					<div className="p-2">
						<h2 className="font-bold text-3xl mb-2">Todo List</h2>
						<ul>
							{allTodos.map((t) => (
								<li
									className="flex items-start justify-between border p-1 mb-2 bg-white"
									key={t.id}>
									<div>
										<p>
											<strong>{t.name}</strong>
										</p>
										<p>{t.description}</p>
									</div>
									<div>
										<button
											className="bg-red-100 p-1 text-red-700 border border-red-700 mr-2 rounded-md"
											onClick={() => deleteTodo(t.id)}>
											Delete
										</button>
										<button
											className="bg-yellow-100 text-yellow-700 border border-yellow-700 p-1 rounded-md"
											onClick={() => getSingleTodo(t.id)}>
											Update
										</button>
									</div>
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</main>
	);
}

export default App;
