import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export const startProductTour = () => {
    const steps = [];

    if (document.querySelector('.zu-topnav-title')) {
        steps.push({
            element: '.zu-topnav-title',
            popover: {
                title: 'Welcome to ZenoHosp Inventory',
                description: "Let's take a quick look around your inventory workspace.",
                side: "bottom",
                align: 'start'
            }
        });
    }

    const addSidebarStep = (tourId, title, description) => {
        if (document.querySelector(`[data-tour="${tourId}"]`)) {
            steps.push({
                element: `[data-tour="${tourId}"]`,
                popover: {
                    title,
                    description,
                    side: "right",
                    align: 'start'
                },
                onHighlightStarted: () => {
                    const el = document.querySelector(`[data-tour="${tourId}"]`);
                    if (el) {
                        el.scrollIntoView({ block: 'center', behavior: 'instant' });
                    }
                }
            });
        }
    };

    addSidebarStep("dashboard", "Dashboard", "Get a quick overview of your inventory health, alerts, and key metrics.");
    addSidebarStep("purchase", "Purchase", "Raise purchase orders, record GRNs, manage bills, contracts and delivery challans here.");
    addSidebarStep("stock", "Stock", "Track stock levels, log movements, handle adjustments, ward indents and low-stock alerts.");
    addSidebarStep("settings", "Settings", "Manage item types, categories, vendors and stores from here.");

    if (document.querySelector('.zu-topnav-user')) {
        steps.push({
            element: '.zu-topnav-user',
            popover: {
                title: 'Profile & Settings',
                description: 'Manage your profile, preferences, and sign out from here.',
                side: "bottom",
                align: 'end'
            }
        });
    }

    if (steps.length === 0) return;

    const driverObj = driver({
        showProgress: true,
        allowClose: true,
        popoverClass: 'zu-driver-popover',
        onDestroyed: () => {
            localStorage.setItem("inventory_tour_completed", "true");
        },
        steps: steps
    });

    driverObj.drive();
};

export default function ProductTour() {
    useEffect(() => {
        // Small delay to ensure the DOM is fully painted
        const timer = setTimeout(() => {
            const isCompleted = localStorage.getItem("inventory_tour_completed");
            if (isCompleted === "true") return;
            startProductTour();
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    return null;
}
