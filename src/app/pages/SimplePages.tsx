// This file contains simple page components for pages that don't need complex layouts
import React from "react";
import { PageTemplate } from "@/app/components/PageTemplate";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Plus } from "lucide-react";

export function createSimplePage(title: string, description: string, columns: string[], rows: any[]) {
  return function Page() {
    return (
      <PageTemplate
        title={title}
        description={description}
        actions={<Button><Plus className="w-4 h-4 mr-2" />Add New</Button>}
      >
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((row, idx) => (
                  <tr key={String(Object.values(row)[0] ?? idx)} className="hover:bg-gray-50">
                    {Object.entries(row).map(([col, value]) => (
                      <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {value as React.ReactNode}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 space-x-3">
                      <button className="hover:underline">View</button>
                      <button className="hover:underline">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </PageTemplate>
    );
  };
}
