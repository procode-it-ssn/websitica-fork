"use client";
import JoinGame from "./JoinGame";

export default function PlayerWaiting(props) {
  return (
    <JoinGame
      initialPhase="waiting"
      initialPlayer={props?.player}
      initialTeam={props?.team}
      {...props}
    />
  );
}
