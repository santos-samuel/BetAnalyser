package simulator.strategies;

import simulator.ROLL;
import simulator.Simulator;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

import static simulator.Simulator.LOG_FILE;

public abstract class Strategy {
    private final String childName;

    // last roll bet
    protected boolean didIBet = false;
    protected float betPotentialReturn = -1;
    protected ROLL betCoin = null;
    protected float betAmount = -1;

    protected float balance = 0;

    public Strategy(String simpleName) {
        this.childName = simpleName;
    }

    public abstract void processResult(ROLL roll);

    public abstract void handleNextDecision(ROLL roll) throws IOException;
    public abstract String print();

    protected void resetBetInfo() {
        didIBet = false;
        betPotentialReturn = -1;
        betAmount = -1;
        betCoin = null;
    }

    protected void performBet(float amount, ROLL betCoin) {
        didIBet = true;

        if (betCoin.equals(ROLL.CT) || betCoin.equals(ROLL.T))
            betPotentialReturn = amount * 2;
        else
            betPotentialReturn = amount * 14;

        betAmount = amount;
        balance = balance - amount;
    }

    public void log(long round) throws IOException {
        FileWriter fw = new FileWriter(LOG_FILE, true);
        BufferedWriter bw = new BufferedWriter(fw);
        bw.write("" + round + "," + balance + "," + childName);
        bw.newLine();
        bw.close();
    }
}
