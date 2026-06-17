"use client";

import * as React from "react";
import { useRef } from "react";
import {
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

import clsx from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...args: any[]) => twMerge(clsx(args));

export interface AnimatedDockProps {
  className?: string;
  items: DockItemData[];
}

export interface DockItemData {
  link?: string;
  Icon: React.ReactNode;
  target?: string;
  onClick?: () => void;
  label?: string;
  isActive?: boolean;
}

export const AnimatedDock = ({ className, items }: AnimatedDockProps) => {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto flex h-full items-end gap-3 rounded-2xl bg-[#031d08]/95 border border-emerald-800/30 shadow-[0_12px_40px_rgba(0,0,0,0.5)] px-4 pb-3 justify-center backdrop-blur-md",
        className
      )}
      id="animated-dock-container"
    >
      {items.map((item, index) => (
        <DockItem key={index} mouseX={mouseX} isActive={item.isActive}>
          {item.onClick ? (
            <button
              onClick={item.onClick}
              type="button"
              className="grow flex items-center justify-center w-full h-full text-white cursor-pointer bg-transparent border-0 outline-none p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-full"
              title={item.label}
              id={`dock-item-btn-${index}`}
            >
              {item.Icon}
            </button>
          ) : (
            <a
              href={item.link || "#"}
              target={item.target}
              rel={item.target === "_blank" ? "noopener noreferrer" : undefined}
              className="grow flex items-center justify-center w-full h-full text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-full"
              title={item.label}
              id={`dock-item-link-${index}`}
            >
              {item.Icon}
            </a>
          )}
        </DockItem>
      ))}
    </motion.div>
  );
};

interface DockItemProps {
  mouseX: MotionValue<number>;
  children: React.ReactNode;
  isActive?: boolean;
  key?: React.Key;
}

export const DockItem = ({ mouseX, children, isActive }: DockItemProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [44, 60, 44]);
  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const iconScale = useTransform(width, [44, 60], [1, 1.34]);
  const iconSpring = useSpring(iconScale, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      className={cn(
        "aspect-square rounded-full flex items-center justify-center transition-colors duration-200 shadow-inner",
        isActive 
          ? "bg-primary border-2 border-emerald-400 text-white" 
          : "bg-[#143d1a] hover:bg-primary-light text-emerald-100"
      )}
    >
      <motion.div
        style={{ scale: iconSpring }}
        className="flex items-center justify-center w-full h-full grow"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
