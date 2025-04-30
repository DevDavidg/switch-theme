if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    const toggleCheckbox = document.getElementById(
      "theme-toggle"
    ) as HTMLInputElement | null;

    const toggleLabel = document.querySelector(
      ".toggle-label"
    ) as HTMLElement | null;

    const toggleSlider = document.querySelector(
      ".toggle-slider"
    ) as HTMLElement | null;

    const sunIcon = document.querySelector(".sun-icon") as HTMLElement | null;
    const moonIcon = document.querySelector(".moon-icon") as HTMLElement | null;
    const lightText = document.querySelector(
      ".light-text"
    ) as HTMLElement | null;
    const darkText = document.querySelector(".dark-text") as HTMLElement | null;

    let isDragging = false;
    let startX = 0;
    let currentTranslateX = 0;
    let isHoverTransformActive = false; // To control hover effect during drag

    const setTheme = (theme: "light" | "dark", applyTransition = true) => {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);

      const isDarkMode = theme === "dark";
      if (toggleCheckbox) {
        toggleCheckbox.checked = isDarkMode;
      }

      currentTranslateX = isDarkMode ? 100 : 0; // Update tracked position to new 100px value

      // Update CSS variable position immediately
      document.documentElement.style.setProperty(
        "--slider-pos",
        `${currentTranslateX}px`
      );

      // Apply direct transform for snapping (or if transition is disabled)
      if (toggleSlider) {
        if (!applyTransition) {
          toggleSlider.style.transition = "none"; // Disable transition temporarily
        }
        toggleSlider.style.transform = `translateX(${currentTranslateX}px)`;

        // Re-enable transition after a frame if it was disabled
        if (!applyTransition) {
          requestAnimationFrame(() => {
            if (toggleSlider) {
              // Check again inside RAF
              toggleSlider.style.transition = ""; // Revert to CSS defined transition
            }
          });
        }
      }
    };

    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;

    if (savedTheme) {
      setTheme(savedTheme, false); // Set initial theme without transition
    } else {
      setTheme(prefersDarkScheme.matches ? "dark" : "light", false);
    }

    // Update initial slider position without transition
    if (toggleSlider) {
      const initialTheme = document.documentElement.getAttribute("data-theme");
      currentTranslateX = initialTheme === "dark" ? 100 : 0; // Updated from 60 to 100
      toggleSlider.style.transition = "none"; // Ensure no transition on load
      toggleSlider.style.transform = `translateX(${currentTranslateX}px)`;
      // Add initial animation on load slightly later
      setTimeout(() => {
        if (toggleSlider) {
          // Check again inside timeout
          toggleSlider.style.transition = ""; // Restore transitions
          toggleSlider.classList.add("loaded");
        }
      }, 50); // Short delay
    }

    toggleCheckbox?.addEventListener("change", () => {
      const isDarkMode = toggleCheckbox.checked;
      const newTheme = isDarkMode ? "dark" : "light";
      setTheme(newTheme); // Apply theme with transition

      // Add change effects (flash) - Bounce is handled by CSS transition/variable
      if (toggleSlider) {
        const flash = document.createElement("div");
        flash.classList.add("theme-flash");
        flash.style.opacity = "0";
        flash.style.backgroundColor = isDarkMode
          ? "rgba(62, 84, 129, 0.2)"
          : "rgba(255, 201, 60, 0.2)";
        document.body.appendChild(flash);

        requestAnimationFrame(() => {
          flash.style.opacity = "1";
          setTimeout(() => {
            flash.style.opacity = "0";
            setTimeout(() => {
              flash.remove();
            }, 300);
          }, 100);
        });

        // Add animating class for enhanced bounce effect
        toggleSlider.classList.add("animating");
        setTimeout(() => {
          toggleSlider.classList.remove("animating");
        }, 800); // Match the animation duration
      }
    });

    toggleLabel?.addEventListener("click", (e) => {
      // Prevent click changing theme if drag just ended on the label
      if (isDragging) {
        // e.preventDefault(); // Might not be needed depending on exact behavior
        return;
      }
      const ripple = document.createElement("span");
      ripple.classList.add("ripple");
      const rect = toggleLabel.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.5;
      ripple.style.width = ripple.style.height = `${size}px`;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      const oldRipples = toggleLabel.querySelectorAll(".ripple");
      oldRipples.forEach((oldRipple) => oldRipple.remove());
      toggleLabel.appendChild(ripple);
      setTimeout(() => {
        ripple.remove();
      }, 900); // Updated from 700 to match new animation time
    });

    // --- Drag Logic ---
    const handleDragStart = (clientX: number) => {
      if (!toggleSlider || !toggleLabel) return;
      isDragging = true;
      isHoverTransformActive = false; // Disable hover transform during drag
      startX = clientX - toggleLabel.getBoundingClientRect().left;
      // Ensure currentTranslateX reflects the actual --slider-pos at drag start
      const currentPosVar =
        document.documentElement.style.getPropertyValue("--slider-pos");
      currentTranslateX = currentPosVar
        ? parseFloat(currentPosVar)
        : toggleCheckbox?.checked
        ? 100 // Updated from 60 to 100
        : 0;

      toggleSlider.style.transition = "none"; // Disable transitions during drag
      toggleLabel.style.cursor = "grabbing"; // Indicate dragging
      toggleLabel.classList.add("is-dragging"); // Add dragging class
      document.body.style.userSelect = "none"; // Prevent text selection
    };

    const handleDragMove = (clientX: number) => {
      if (!isDragging || !toggleSlider || !toggleLabel) return;
      const rect = toggleLabel.getBoundingClientRect();
      const currentX = clientX - rect.left;
      let deltaX = currentX - startX;
      let newTranslateX = currentTranslateX + deltaX;

      // Clamp position between 0 and 100 (updated from 60)
      newTranslateX = Math.max(0, Math.min(100, newTranslateX));

      // Update BOTH the direct transform AND the CSS variable during drag
      toggleSlider.style.transform = `translateX(${newTranslateX}px)`;
      document.documentElement.style.setProperty(
        "--slider-pos",
        `${newTranslateX}px`
      );

      // Update text opacity based on slider position (0-100 range)
      if (lightText && darkText) {
        lightText.style.opacity = (1 - newTranslateX / 100).toString();
        darkText.style.opacity = (newTranslateX / 100).toString();
      }
    };

    const handleDragEnd = () => {
      if (!isDragging || !toggleSlider || !toggleLabel) return;
      isDragging = false;
      toggleLabel.style.cursor = "pointer"; // Restore cursor
      toggleLabel.classList.remove("is-dragging"); // Remove dragging class
      document.body.style.userSelect = ""; // Re-enable text selection

      // Get the final dragged position directly from the CSS var now
      const finalTranslateX = parseFloat(
        document.documentElement.style.getPropertyValue("--slider-pos") || "0"
      );

      // Determine theme based on final position (threshold is middle: 50px now)
      const newTheme = finalTranslateX > 50 ? "dark" : "light"; // Updated threshold from 30 to 50
      const currentTheme = document.documentElement.getAttribute("data-theme");

      // Re-enable CSS transitions for snapping BEFORE setting the theme
      if (toggleSlider) {
        toggleSlider.style.transition = "";

        // Add animating class for bounce effect on drag release
        toggleSlider.classList.add("animating");
        setTimeout(() => {
          toggleSlider.classList.remove("animating");
        }, 800);
      }

      if (newTheme !== currentTheme) {
        setTheme(newTheme); // Set theme (which handles snapping via CSS var update)
        if (
          toggleCheckbox &&
          toggleCheckbox.checked !== (newTheme === "dark")
        ) {
          toggleCheckbox.checked = newTheme === "dark";
        }
      } else {
        // Snap back to original position if theme didn't change
        const snapPosition = currentTheme === "dark" ? 100 : 0; // Updated from 60 to 100
        // Let setTheme handle snapping for consistency
        setTheme(currentTheme === "dark" ? "dark" : "light");
      }

      // Re-enable hover check after a short delay
      setTimeout(() => {
        isHoverTransformActive = false; // Reset hover flag
      }, 50);
    };

    // Mouse Events
    toggleSlider?.addEventListener("mousedown", (e) => {
      handleDragStart(e.clientX);
    });

    document.addEventListener("mousemove", (e) => {
      if (isDragging) handleDragMove(e.clientX);
    });

    document.addEventListener("mouseup", () => {
      if (isDragging) handleDragEnd();
    });

    // Touch Events
    toggleSlider?.addEventListener(
      "touchstart",
      (e) => {
        handleDragStart(e.touches[0].clientX);
      },
      { passive: true }
    ); // Use passive for better scroll performance if slider isn't meant to block scroll

    document.addEventListener("touchmove", (e) => {
      if (isDragging) {
        // Prevent default scroll behavior *only* during drag
        // e.preventDefault(); // Be cautious with this, might block page scrolling
        handleDragMove(e.touches[0].clientX);
      }
    }); // Consider { passive: false } if preventDefault is used

    document.addEventListener("touchend", () => {
      if (isDragging) handleDragEnd();
    });

    // --- Modified Hover Effect ---
    toggleLabel?.addEventListener("mousemove", (e) => {
      if (!toggleSlider || isDragging) {
        // Don't apply hover transform if dragging
        if (toggleSlider && !isDragging && !isHoverTransformActive) {
          // Reset to base position if hover ends but wasn't dragging
          const baseX = toggleCheckbox?.checked ? 100 : 0; // Updated from 60 to 100
          toggleSlider.style.transition =
            "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"; // Smooth return, updated timing
          toggleSlider.style.transform = `translateX(${baseX}px)`;
          toggleSlider.style.boxShadow = toggleCheckbox?.checked
            ? "0 0 25px rgba(126, 145, 179, 0.8)" // Enhanced shadow
            : "0 5px 20px rgba(0, 0, 0, 0.15)"; // Enhanced shadow
        }
        return;
      }
      isHoverTransformActive = true; // Mark hover as active

      const rect = toggleLabel.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const moveX = ((x - centerX) / (rect.width / 2)) * 6; // 6px max, increased from 4
      const moveY = ((y - centerY) / (rect.height / 2)) * 5; // 5px max, increased from 3

      const baseX = toggleCheckbox?.checked ? 100 : 0; // Updated from 60 to 100

      // Apply ONLY Y-axis move and rotation/glow from hover, X is handled by theme/drag
      toggleSlider.style.transition =
        "box-shadow 0.3s ease, transform 0.1s ease-out"; // Faster transform response on hover
      toggleSlider.style.transform = `translate(${baseX}px, ${moveY}px)`; // Use baseX, only add moveY

      const distance = Math.sqrt(
        Math.pow(
          x - (toggleSlider.offsetLeft + toggleSlider.offsetWidth / 2),
          2
        ) +
          Math.pow(
            y - (toggleSlider.offsetTop + toggleSlider.offsetHeight / 2),
            2
          )
      );

      const maxDistance = 120; // Increased from 100
      const brightness = Math.max(0, 1 - distance / maxDistance);

      if (brightness > 0.1) {
        const glowColor = toggleCheckbox?.checked
          ? `rgba(126, 145, 179, ${brightness * 0.9})` // Enhanced brightness
          : `rgba(255, 201, 60, ${brightness * 0.9})`; // Enhanced brightness

        toggleSlider.style.boxShadow = `0 0 ${brightness * 30}px ${
          brightness * 15
        }px ${glowColor}`; // Enhanced glow effect

        // Add subtle rotation based on mouse position (applied on top of translate)
        const rotationAmount = (moveX * 1.8 + moveY) / 3; // Adjust rotation influence, increased from 1.5
        toggleSlider.style.transform += ` rotate(${rotationAmount}deg)`;
      } else {
        toggleSlider.style.boxShadow = toggleCheckbox?.checked
          ? "0 0 25px rgba(126, 145, 179, 0.8)" // Enhanced shadow
          : "0 5px 20px rgba(0, 0, 0, 0.15)"; // Enhanced shadow
      }
    });

    toggleLabel?.addEventListener("mouseleave", () => {
      if (!toggleSlider || isDragging) return; // Don't reset if dragging
      isHoverTransformActive = false; // Mark hover as inactive

      const baseX = toggleCheckbox?.checked ? 100 : 0; // Updated from 60 to 100

      // Restore base position and shadow smoothly
      toggleSlider.style.transition =
        "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)"; // Smoother return
      toggleSlider.style.transform = `translateX(${baseX}px)`; // Reset only translateX

      toggleSlider.style.boxShadow = toggleCheckbox?.checked
        ? "0 0 25px rgba(126, 145, 179, 0.8)" // Enhanced shadow
        : "0 5px 20px rgba(0, 0, 0, 0.15)"; // Enhanced shadow
    });
  });
}
