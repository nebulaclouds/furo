import Gumshoe from "./gumshoe-patched.js";

////////////////////////////////////////////////////////////////////////////////
// Scroll Handling
////////////////////////////////////////////////////////////////////////////////
var tocScroll = null;
var header = null;
var lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
const GO_TO_TOP_OFFSET = 64;

function scrollHandlerForHeader() {
  if (Math.floor(header.getBoundingClientRect().top) == 0) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
}

function scrollHandlerForBackToTop(positionY) {
  if (positionY < GO_TO_TOP_OFFSET) {
    document.documentElement.classList.remove("show-back-to-top");
  } else {
    if (positionY < lastScrollTop) {
      document.documentElement.classList.add("show-back-to-top");
    } else if (positionY > lastScrollTop) {
      document.documentElement.classList.remove("show-back-to-top");
    }
  }
  lastScrollTop = positionY;
}

function scrollHandlerForTOC(positionY) {
  if (tocScroll === null) {
    return;
  }

  // top of page.
  if (positionY == 0) {
    tocScroll.scrollTo(0, 0);
  } else if (
    // bottom of page.
    Math.ceil(positionY) >=
    Math.floor(document.documentElement.scrollHeight - window.innerHeight)
  ) {
    tocScroll.scrollTo(0, tocScroll.scrollHeight);
  } else {
    // somewhere in the middle.
    const current = document.querySelector(".scroll-current");
    if (current == null) {
      return;
    }

    // https://github.com/pypa/pip/issues/9159 This breaks scroll behaviours.
    // // scroll the currently "active" heading in toc, into view.
    // const rect = current.getBoundingClientRect();
    // if (0 > rect.top) {
    //   current.scrollIntoView(true); // the argument is "alignTop"
    // } else if (rect.bottom > window.innerHeight) {
    //   current.scrollIntoView(false);
    // }
  }
}

function scrollHandler(positionY) {
  scrollHandlerForHeader();
  scrollHandlerForBackToTop(positionY);
  scrollHandlerForTOC(positionY);
}

////////////////////////////////////////////////////////////////////////////////
// Theme Toggle
////////////////////////////////////////////////////////////////////////////////
function setTheme(mode) {
  if (mode !== "light" && mode !== "dark" && mode !== "auto") {
    console.error(`Got invalid theme mode: ${mode}. Resetting to auto.`);
    mode = "auto";
  }

  document.body.dataset.theme = mode;
  localStorage.setItem("theme", mode);
  console.log(`Changed to ${mode} mode.`);
}

function cycleThemeOnce() {
  const currentTheme = localStorage.getItem("theme") || "auto";
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (prefersDark) {
    // Auto (dark) -> Light -> Dark
    if (currentTheme === "auto") {
      setTheme("light");
    } else if (currentTheme == "light") {
      setTheme("dark");
    } else {
      setTheme("auto");
    }
  } else {
    // Auto (light) -> Dark -> Light
    if (currentTheme === "auto") {
      setTheme("dark");
    } else if (currentTheme == "dark") {
      setTheme("light");
    } else {
      setTheme("auto");
    }
  }
}

////////////////////////////////////////////////////////////////////////////////
// Setup
////////////////////////////////////////////////////////////////////////////////
function setupScrollHandler() {
  // Taken from https://developer.mozilla.org/en-US/docs/Web/API/Document/scroll_event
  let last_known_scroll_position = 0;
  let ticking = false;

  window.addEventListener("scroll", function (e) {
    last_known_scroll_position = window.scrollY;

    if (!ticking) {
      window.requestAnimationFrame(function () {
        scrollHandler(last_known_scroll_position);
        ticking = false;
      });

      ticking = true;
    }
  });
  window.scroll();
}

function setupScrollSpy() {
  if (tocScroll === null) {
    return;
  }

  // Scrollspy -- highlight table on contents, based on scroll
  new Gumshoe(".toc-tree a", {
    reflow: true,
    recursive: true,
    navClass: "scroll-current",
    offset: () => {
      let rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      return header.getBoundingClientRect().height + 0.5 * rem + 1;
    },
  });
}

function setupTheme() {
  // Attach event handlers for toggling themes
  const buttons = document.getElementsByClassName("theme-toggle");
  Array.from(buttons).forEach((btn) => {
    btn.addEventListener("click", cycleThemeOnce);
  });
}

function setup() {
  setupTheme();
  setupScrollHandler();
  setupScrollSpy();
}

// Custom nebula theme logic
var toggleCurrentSubsection = function() {
  // only show currently selected subsection
  $(".sidebar-tree").children("ul.current").each(function() {
    $(this).css("display", "block");
    $(this).prev("p.caption").css("display", "block");
  });
}

const ApiReferenceCaptions = ["Nebulakit SDK", "NebulaIDL", "Nebulactl"];

var highlightCurrentSubsection = function() {
  // highlight the current subsection in the main nav
  var currentSection = $(".sidebar-tree").children("ul.current");
  var caption = currentSection.prev("p.caption").text();

  if (ApiReferenceCaptions.includes(caption)) {
    caption = "API Reference";
  }

  // highlight the current subsection in the top-level nav header
  var navHeaderSections = $(".nav-header .main-sections")
  navHeaderSections.find("div a div.brand").each(function() {
    var text = $(this).text()
    if (text === caption) {
      $(this).addClass("current")
    }
  })
}

////////////////////////////////////////////////////////////////////////////////
// Main entrypoint
////////////////////////////////////////////////////////////////////////////////
function main() {
  document.body.parentNode.classList.remove("no-js");

  header = document.querySelector("header");
  tocScroll = document.querySelector(".toc-scroll");

  setup();

  highlightCurrentSubsection();
  toggleCurrentSubsection();

  // THIS IS A HACK! hide the "main nav" index in the sidebar
  setTimeout(function() {
    // always hide the "main nav"
    $(".sidebar-tree").children("ul").first().css("display", "none");
    // hide caption text for "nav subsection"
    $(".sidebar-tree .caption-text").css("display", "none");
  }, 10);

  // custom scrolling on toc
  setTimeout(function() {
    jQuery(".sidebar-scroll").animate({opacity: 1.0}, 100);
  }, 10);
}

document.addEventListener("DOMContentLoaded", main);


// Logic for handling the rendering of mermaid diagrams.
function renderMermaid() {
  jQuery(".mermaid").each(function(i, el) {
    if (jQuery(el).parent()[0].getAttribute("hidden") === 'true') {
      // don't render mermaid charts whose parent node is hidden
    } else {
      mermaid.init(jQuery(el));
    }
  });
}

jQuery(function() {
  renderMermaid()

  // listen for clicks on tab buttons
  jQuery("button.sphinx-tabs-tab").on("click", function() {
    renderMermaid();
  });

  //listen for clicks in .nav-toggler to collapse/expand main-sections and external-links
  jQuery("div.nav-toggler").on("click", function() {
    var mainSections = jQuery(".nav-header .main-sections");
    mainSections.toggleClass("nav-collapsed");
    jQuery(".nav-header .external-links").toggleClass("nav-collapsed")

    var navToggleIcon = jQuery(".nav-header .nav-toggler i.fas");
    if (mainSections.hasClass("nav-collapsed")) {
      navToggleIcon.addClass("fa-chevron-down");
      navToggleIcon.removeClass("fa-chevron-up");
    } else {
      navToggleIcon.addClass("fa-chevron-up");
      navToggleIcon.removeClass("fa-chevron-down");
    }
  });
})
