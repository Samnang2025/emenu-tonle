import Link from "next/link";

export default function Home() {
	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center">
			<div className="text-center p-8">
				<h1 className="text-4xl font-bold text-gray-800 mb-4 font-dangrek">
					Welcome to E-Menu
				</h1>
				<p className="text-lg text-gray-600 mb-8">
					Digital menu system for restaurants
				</p>
				<p className="text-sm text-gray-500">
					Access your menu at: <code className="bg-gray-200 px-2 py-1 rounded">/[projectName]</code>
				</p>
			</div>
		</div>
	);
}
