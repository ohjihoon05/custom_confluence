var AJS = require("ajs");

const cleanTabContent = function () {
  const tabContents = document.querySelectorAll(".aura-tab-content > *");

  tabContents.forEach(function (panel) {
    if (!panel.hasAttribute("data-aura-tab-id")) {
      panel.remove();
    }
  });
};

const showFirstTabs = function () {
  const firstTabPanels = document.querySelectorAll(
    "[data-aura-tab-title]:first-child"
  );

  firstTabPanels.forEach(function (panel) {
    panel.removeAttribute("hidden");
  });
};

const fixInnerTabStyles = function () {
  const allWrappers = document.querySelectorAll(
    "[data-macro-name='aura-tab-collection'] > style"
  );
  allWrappers.forEach(function (style) {
    style.innerHTML = style.innerHTML.replace(/\&gt\;/g, ">");
  });
};

window.addEventListener("DOMContentLoaded", function () {
  const tabs = document.querySelectorAll('[role="tab"]');
  const tabList = document.querySelector('[role="tablist"]');

  cleanTabContent();
  showFirstTabs();
  fixInnerTabStyles();

  // Add a click event handler to each tab
  tabs.forEach(function (tab) {
    tab.addEventListener("click", changeTabs);
  });

  // Enable arrow navigation between tabs in the tab list
  let tabFocus = 0;

  tabList.addEventListener("keydown", function (e) {
    // Move right
    if (e.keyCode === 39 || e.keyCode === 37) {
      tabs[tabFocus].setAttribute("tabindex", -1);
      if (e.keyCode === 39) {
        tabFocus++;
        // If we're at the end, go to the start
        if (tabFocus >= tabs.length) {
          tabFocus = 0;
        }
        // Move left
      } else if (e.keyCode === 37) {
        tabFocus--;
        // If we're at the start, move to the end
        if (tabFocus < 0) {
          tabFocus = tabs.length - 1;
        }
      }

      tabs[tabFocus].setAttribute("tabindex", 0);
      tabs[tabFocus].focus();
    }
  });

  // Linchpin does not receive events if it's loading slower
  // Account for loading times

  const interval = setInterval(notifyListeners, 100);

  setTimeout(function () {
    clearInterval(interval);
  }, 3000);
});

function changeTabs(e) {
  const target = e.target;
  const parent = target.parentNode;
  const grandparent = parent.parentNode.parentNode;

  // Remove all current selected tabs
  parent.querySelectorAll('[aria-selected="true"]').forEach(function (t) {
    return t.setAttribute("aria-selected", false);
  });

  // Set this tab as selected
  target.setAttribute("aria-selected", true);
  const id = grandparent.getAttribute("id");

  grandparent
    .querySelectorAll(`#${id} > .aura-tab-content > [role="tabpanel"]`)
    .forEach(function (p) {
      return p.setAttribute("hidden", true);
    });

  // Show the selected panel
  grandparent
    .querySelector(`#${target.getAttribute("aria-controls")}`)
    .removeAttribute("hidden");

  notifyListeners();
}

const notifyListeners = function () {
  setTimeout(function () {
    AJS.trigger("appanvil/aura/tabs/open", {});
  });
};
