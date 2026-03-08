"use client";

import React from "react";
import { z } from "zod";
import { useForm } from "@/hooks/useForm";
import { useOffline } from "@/components/offline/OfflineProvider";

const goalSchema = z.object({
  title: z
    .string()
    .min(1, "Goal title is required")
    .max(100, "Title is too long"),
  targetAmount: z.coerce
    .number()
    .positive("Target amount must be positive")
    .min(1, "Minimum target is 1 XLM"),
  deadline: z.string().refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date > new Date();
    },
    {
      message: "Deadline must be a future date",
    },
  ),
});

type GoalFormData = z.infer<typeof goalSchema>;

// Bridge type for the custom useForm hook whose handleSubmit doesn't
// propagate TFieldValues generics correctly. Uses `unknown` not `any`.
type HandleSubmitFn = (
  handler: (data: unknown) => void | Promise<void>,
) => React.FormEventHandler<HTMLFormElement>;

export default function GoalForm() {
  const { isOnline, queueAction } = useOffline();
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    reset,
  } = useForm<GoalFormData>({
    schema: goalSchema,
    defaultValues: {
      title: "",
      targetAmount: 0,
      deadline: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: GoalFormData) => {
    if (!isOnline) {
      queueAction("CREATE_GOAL", `Create goal: ${data.title}`, data);
      alert(
        "You are offline. Your goal has been queued and will be saved when you reconnect.",
      );
      reset();
      return;
    }

    // Simulate API call
    console.log("Goal submitted:", data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert("Savings goal created successfully!");
    reset();
  };

  return (
    <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
      <div className="flex items-center space-x-2 mb-6">
        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
          <svg
            className="w-6 h-6 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Savings Goal
        </h2>
      </div>

      <form
        onSubmit={(handleSubmit as unknown as HandleSubmitFn)(onSubmit)}
        className="space-y-4"
      >
        <div className="space-y-1">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Goal Title
          </label>
          <input
            id="title"
            {...register("title")}
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500 outline-none transition-all ${
              errors.title
                ? "border-red-500 bg-red-50"
                : "border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            }`}
            placeholder="e.g. New Laptop"
          />
          {errors.title && (
            <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="targetAmount"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Target Amount (XLM)
          </label>
          <input
            id="targetAmount"
            type="number"
            {...register("targetAmount")}
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500 outline-none transition-all ${
              errors.targetAmount
                ? "border-red-500 bg-red-50"
                : "border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            }`}
            placeholder="500"
          />
          {errors.targetAmount && (
            <p className="text-xs text-red-500 mt-1">
              {errors.targetAmount.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="deadline"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Deadline Date
          </label>
          <input
            id="deadline"
            type="date"
            {...register("deadline")}
            className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-green-500 outline-none transition-all ${
              errors.deadline
                ? "border-red-500 bg-red-50"
                : "border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            }`}
          />
          {errors.deadline && (
            <p className="text-xs text-red-500 mt-1">
              {errors.deadline.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="w-full mt-6 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
        >
          {isSubmitting ? "Creating..." : "Create Goal"}
        </button>
      </form>
    </div>
  );
}
