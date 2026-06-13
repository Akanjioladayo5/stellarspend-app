"use client";

import BudgetForm from '@/components/budgets/BudgetForm';
import GoalForm from '@/components/savings/GoalForm';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Grid } from '@/components/ui/Grid';

export default function TestFormsPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Form Integration Test</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Testing useForm hook wrapper with Zod validation.
                    </p>
                </div>

                <Grid cols={1} gap="lg" responsive={{ md: 2 }}>
                    <Card variant="default">
                        <CardHeader>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Budget Form</h2>
                        </CardHeader>
                        <CardBody>
                            <BudgetForm onSubmit={() => {}} />
                        </CardBody>
                    </Card>

                    <Card variant="default">
                        <CardHeader>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Goal Form</h2>
                        </CardHeader>
                        <CardBody>
                            <GoalForm open={true} onOpenChange={() => {}} onGoalCreated={() => {}} />
                        </CardBody>
                    </Card>
                </Grid>
            </div>
        </div>
    );
}
