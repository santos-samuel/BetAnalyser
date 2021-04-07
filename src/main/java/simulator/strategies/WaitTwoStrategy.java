package simulator.strategies;

import simulator.ROLL;
import simulator.Simulator;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.util.List;
import java.util.stream.Collectors;

// Note, careful with dices
/*
 * Bet CT after two Ts
 * Bet T after two CTs
* */
public class WaitTwoStrategy extends Strategy {

    private static final float BET_AMOUNT = (float) 1;
    private final Simulator simulator;


    public WaitTwoStrategy(Simulator simulator) {
        super("WaitTwoStrategy");
        this.simulator = simulator;
    }

    @Override
    public void processResult(ROLL roll) {
        if (didIBet) {
            if (roll.equals(betCoin)) {
                balance = balance + betPotentialReturn;
            }
            resetBetInfo();
        }
    }

    @Override
    public void handleNextDecision(ROLL roll) throws IOException {
        List<ROLL> previous2Rolls = simulator.getPreviousXRolls(2);
        if (previous2Rolls.size() == 2) {
            List<ROLL> ctFilter = previous2Rolls.stream().filter(r -> r.equals(ROLL.CT)).collect(Collectors.toList());
            List<ROLL> tFilter = previous2Rolls.stream().filter(r -> r.equals(ROLL.T)).collect(Collectors.toList());
            if (ctFilter.size() == 2 || tFilter.size() == 2) {
                betCoin = ctFilter.size() == 2 ? ROLL.T : ROLL.CT;
                super.performBet(BET_AMOUNT, betCoin);
            }
        }
    }

    @Override
    public String print() {
        return "Strategy: " + this.getClass().getSimpleName() + "\nBalance = " + balance + "\n";
    }
}
