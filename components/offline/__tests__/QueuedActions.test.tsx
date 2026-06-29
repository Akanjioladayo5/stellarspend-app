import { render, screen } from "@testing-library/react";
import QueuedActions from "../QueuedActions";

jest.mock("../OfflineProvider", () => ({
  useOffline: () => ({
    queuedActions: [
      { id: "1" },
      { id: "2" },
      { id: "3" },
    ],
  }),
}));

describe("QueuedActions", () => {
  it("shows queued actions badge", () => {
    render(<QueuedActions />);

    expect(screen.getByLabelText("3 queued actions")).toBeTruthy();
  });
});