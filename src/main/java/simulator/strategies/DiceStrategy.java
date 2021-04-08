package simulator.strategies;

import simulator.ROLL;
import simulator.Simulator;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/*
* */
public class DiceStrategy extends Strategy {

    private static final BigDecimal STARTING_BET = new BigDecimal("0.01");
    private static final BigDecimal INCREASE_BET_BY = new BigDecimal("1.07");
    private final Simulator simulator;
    private static final int WAIT_ROLLS = 40;

    private int betStreak = 0;
    private BigDecimal accumulatedAmount = new BigDecimal(0);

    public DiceStrategy(Simulator simulator) {
        super("DiceStrategy");
        this.simulator = simulator;
    }

    @Override
    public void processResult(ROLL roll) {
        if (didIBet) {
            if (roll.equals(betCoin)) {
                balance = balance.add(betPotentialReturn).setScale(2, RoundingMode.HALF_UP);
                resetBetInfo();

                accumulatedAmount = new BigDecimal(0).setScale(2, RoundingMode.HALF_UP);
                betStreak = 0;
            }
        }
    }

    @Override
    public void handleNextDecision(ROLL roll) throws Exception {
        List<ROLL> previousWaitRolls = simulator.getPreviousXRolls(WAIT_ROLLS);
        if (previousWaitRolls.size() != WAIT_ROLLS)
            return;
        for (ROLL r : previousWaitRolls) {
            if (r.equals(ROLL.DICE))
                return;
        }

        betCoin = ROLL.DICE;

        if (!didIBet) {
            // first time
            super.performBet(STARTING_BET.setScale(2, RoundingMode.HALF_UP), betCoin);
            accumulatedAmount = STARTING_BET.setScale(2, RoundingMode.HALF_UP);
            betStreak = 1;
        } else {
            // other times
            BigDecimal oldAccumulatedAmount = accumulatedAmount.add(BigDecimal.valueOf(0)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal oldPotentialProfit = betPotentialReturn.subtract(oldAccumulatedAmount).setScale(2, RoundingMode.HALF_UP);
            BigDecimal oldBetAmount = betAmount.setScale(2, RoundingMode.HALF_UP);
            BigDecimal formulaDiff = oldPotentialProfit.subtract(oldBetAmount).setScale(2, RoundingMode.HALF_UP);

            BigDecimal newBetAmount;
            if (formulaDiff.compareTo(BigDecimal.valueOf(0.01)) < 0) {
                newBetAmount = oldBetAmount.multiply(INCREASE_BET_BY).setScale(2, RoundingMode.UP);
            } else {
                newBetAmount = oldBetAmount;
            }

            BigDecimal futurePotentialReturn = newBetAmount.multiply(BigDecimal.valueOf(14)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal futureAccumulatedAmount = oldAccumulatedAmount.add(newBetAmount).setScale(2, RoundingMode.HALF_UP);
            BigDecimal afterBetPotentialProfit = futurePotentialReturn.subtract(futureAccumulatedAmount).setScale(2, RoundingMode.HALF_UP);
            BigDecimal futureBalance = balance.subtract(newBetAmount).setScale(2, RoundingMode.HALF_UP);


            // get out if no profit
//            if (afterBetPotentialProfit.compareTo(BigDecimal.valueOf(0)) < 0) {
//                // don't bet
//                resetBetInfo();
//                accumulatedAmount = new BigDecimal(0).setScale(2, RoundingMode.HALF_UP);
//                betStreak = 0;
//            } else {
//                super.performBet(newBetAmount, betCoin);
//                accumulatedAmount = futureAccumulatedAmount;
//                betStreak += 1;
//            }

            // keep balance above 10
//            if (futureBalance.compareTo(BigDecimal.valueOf(-10)) < 0) {
//                // don't bet
//                resetBetInfo();
//                accumulatedAmount = new BigDecimal(0).setScale(2, RoundingMode.HALF_UP);
//                betStreak = 0;
//            } else {
//                super.performBet(newBetAmount, betCoin);
//                accumulatedAmount = futureAccumulatedAmount;
//                betStreak += 1;
//            }

            // always go
            super.performBet(newBetAmount, betCoin);
            accumulatedAmount = futureAccumulatedAmount;
            betStreak += 1;

//            System.out.println(betStreak + " " + newBetAmount + " " + accumulatedAmount + " " + betPotentialReturn + " " + newPotentialProfit);
        }
    }

    @Override
    public String print() {
        return "Strategy: " + this.getClass().getSimpleName() + "\nBalance = " + balance + "\n";
    }
}
