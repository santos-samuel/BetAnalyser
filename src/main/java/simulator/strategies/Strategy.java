package simulator.strategies;

import simulator.ROLL;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;

import static simulator.Simulator.LOG_FILE;

public abstract class Strategy {
    private final String childName;

    // last roll bet
    protected boolean didIBet = false;
    protected BigDecimal betPotentialReturn = BigDecimal.valueOf(-1);
    protected ROLL betCoin = null;
    protected BigDecimal betAmount = BigDecimal.valueOf(-1);

    protected BigDecimal balance;

    public Strategy(String simpleName) {
        this.childName = simpleName;
        balance = BigDecimal.valueOf(0);
        balance = balance.setScale(2, RoundingMode.HALF_UP);
    }

    public abstract void processResult(ROLL roll);

    public abstract void handleNextDecision(ROLL roll) throws Exception;
    public abstract String print();

    protected void resetBetInfo() {
        didIBet = false;
        betPotentialReturn = new BigDecimal(-1);
        betAmount = new BigDecimal(-1);
        betCoin = null;
    }

    protected void performBet(BigDecimal amount, ROLL betCoin) throws Exception {
        if (amount.compareTo(new BigDecimal(0)) < 0 || betCoin == null)
            throw new Exception();
        didIBet = true;
        if (betCoin.equals(ROLL.CT) || betCoin.equals(ROLL.T)) {
            betPotentialReturn = amount.multiply(new BigDecimal(2)).setScale(2, RoundingMode.HALF_UP);
        }
        else {
            betPotentialReturn = amount.multiply(new BigDecimal(14)).setScale(2, RoundingMode.HALF_UP);
        }

        betAmount = amount.setScale(2, RoundingMode.HALF_UP);
        balance = balance.subtract(amount).setScale(2, RoundingMode.HALF_UP);
    }

    public void log(long round, String fileName) throws IOException {
        FileWriter fw = new FileWriter(LOG_FILE, true);
        BufferedWriter bw = new BufferedWriter(fw);
        bw.write("" + round + "," + balance + "," + childName + "," + fileName);
        bw.newLine();
        bw.close();
    }
}
