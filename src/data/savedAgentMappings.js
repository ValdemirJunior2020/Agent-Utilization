// /src/data/savedAgentMappings.js

export const savedAgentMappingFiles = [
  {
    callCenter: "Concentrix",
    fileName: "Concentrix Logins.xlsx",
    url: "/agent-mappings/Concentrix%20Logins.xlsx",
    sheetName: "CON Master List",
    fullNameColumn: "D",
    hpIdColumns: ["K"],
    sourceLabel: "Concentrix Master List",
    description:
      "Concentrix mapping. Column K contains the HP ID used in Tableau. Column D contains the real agent name.",
  },

  {
    callCenter: "WNS",
    fileName: "WNS Agents.xlsx",
    url: "/agent-mappings/WNS%20Agents.xlsx",
    sheetName: "Active agents",
    firstNameColumn: "D",
    lastNameColumn: "E",
    hpIdColumns: ["H"],
    sourceLabel: "WNS Active Agents",
    description:
      "WNS active agent mapping. Column D contains first name, Column E contains last name, and Column H contains the HP ID.",
  },

  {
    callCenter: "Buwelo",
    fileName: "Buwelo Agents.xlsx",
    url: "/agent-mappings/Buwelo%20Agents.xlsx",
    sheetName: "Active Agents - COL",
    firstNameColumn: "E",
    lastNameColumn: "F",
    hpIdColumns: ["L"],
    sourceLabel: "Buwelo Colombia Active Agents",
    description:
      "Buwelo Colombia mapping. Column E contains first name, Column F contains last name, and Column L contains the HP ID.",
  },

  {
    callCenter: "Buwelo",
    fileName: "Buwelo Agents.xlsx",
    url: "/agent-mappings/Buwelo%20Agents.xlsx",
    sheetName: "Active Agents - GH",
    firstNameColumn: "D",
    lastNameColumn: "E",
    hpIdColumns: ["K"],
    sourceLabel: "Buwelo Ghana Active Agents",
    description:
      "Buwelo Ghana mapping. Column D contains first name, Column E contains last name, and Column K contains the HP ID.",
  },

  {
    callCenter: "TEP",
    fileName: "Teleperformance Logins.xlsx",
    url: "/agent-mappings/Teleperformance%20Logins.xlsx",
    sheetName: "Active",
    fullNameColumn: "F",
    hpIdColumns: ["J", "E", "I"],
    billableColumn: "L",
    sourceLabel: "TEP Active Agents",
    description:
      "TEP mapping. Column F contains the full name. Column J contains the Tableau ID when available. Columns E and I contain TP ID fallback values. Column L contains Billable Y/N.",
  },
];