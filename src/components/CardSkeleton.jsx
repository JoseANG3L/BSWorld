import React from 'react';

/** Esqueleto con la forma de Card (evita saltos de layout). */
export const CardSkeleton = () => (
  <div className="flex flex-col rounded-xl h-full animate-pulse" aria-hidden="true">
    <div className="w-full aspect-video rounded-xl bg-gray-200 dark:bg-[#1D1F23]" />
    <div className="flex items-start gap-2 px-1 pt-2">
      <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-200 dark:bg-[#1D1F23] shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 rounded bg-gray-200 dark:bg-[#1D1F23] w-3/4" />
        <div className="h-3 rounded bg-gray-200 dark:bg-[#1D1F23] w-1/3" />
      </div>
    </div>
    <div className="mx-1 mt-2 h-9 rounded-lg bg-gray-200 dark:bg-[#1D1F23]" />
  </div>
);

/** Esqueleto con la forma de un post del foro. */
export const PostSkeleton = () => (
  <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1e1e1e] p-4 space-y-3 animate-pulse" aria-hidden="true">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-2 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
    <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
    <div className="space-y-2">
      <div className="h-3 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-3 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  </div>
);

export default CardSkeleton;
